const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { getIO } = require('../socket');

/**
 * @route   POST /api/messages
 * @desc    Sends a chat message to another user (Secure route)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;

    // 1. Validation
    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ error: "Receiver ID and message content are required." });
    }

    // 2. Prevent messaging oneself
    if (senderId === receiverId) {
      return res.status(400).json({ error: "You cannot send a message to yourself." });
    }

    // 3. Verify that the receiver actually exists in our system
    const receiverExists = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiverExists) {
      return res.status(404).json({ error: "Recipient user not found." });
    }

    // 3.5 Check if chat section is unlocked via an active order (₹6 booking fee paid)
    const activeOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { buyerId: senderId, sellerId: receiverId },
          { buyerId: receiverId, sellerId: senderId }
        ],
        status: { in: ['PENDING', 'PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'] }
      }
    });

    if (!activeOrder) {
      return res.status(403).json({
        error: "Chat Section Locked! 🔒 You must place a hire request (₹6 platform booking fee) to unlock chat with this user.",
        isLocked: true
      });
    }

    // 4. Save the message to the database
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim()
      }
    });

    // ── Emit real-time events via Socket.IO ──────────────────────────
    const io = getIO();
    if (io) {
      // Send the full message to both participants' private rooms
      io.to(`user:${senderId}`).to(`user:${receiverId}`).emit('new_message', newMessage);
      // Signal both inboxes to refresh their thread lists
      io.to(`user:${senderId}`).to(`user:${receiverId}`).emit('threads_updated');
    }

    return res.status(201).json({
      message: "Message sent!",
      chatMessage: newMessage
    });

  } catch (error) {
    console.error("Send Message Error:", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
});

/**
 * @route   GET /api/messages
 * @desc    Retrieves a list of all unique chat conversation threads for the current user (Secure route)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all messages where current user is either sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Extract unique partner IDs and keep their latest message
    const partnerMap = new Map();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, msg);
      }
    }

    const partnerIds = Array.from(partnerMap.keys());

    // Fetch user details for all unique partners
    const partners = await prisma.user.findMany({
      where: {
        id: { in: partnerIds }
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        isSeller: true
      }
    });

    const threads = partners.map(partner => {
      const latestMsg = partnerMap.get(partner.id);
      return {
        id: partner.id, // Using partner user ID as thread ID
        counterpart: partner,
        latestMessage: {
          id: latestMsg.id,
          text: latestMsg.content,
          createdAt: latestMsg.createdAt,
          senderId: latestMsg.senderId,
          receiverId: latestMsg.receiverId
        }
      };
    });

    // Sort threads by latest message timestamp descending
    threads.sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));

    // Pagination support: ?page=1&limit=20
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const totalCount = threads.length;
    const totalPages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const paginatedThreads = threads.slice(start, start + limit);

    return res.json({ count: paginatedThreads.length, threads: paginatedThreads, page, totalPages, totalCount });
  } catch (error) {
    console.error("Fetch Chat Threads Error:", error);
    return res.status(500).json({ error: "Failed to load conversations." });
  }
});

/**
 * @route   GET /api/messages/:userId
 * @desc    Fetch chat history conversation with a specific user (Secure route)
 */
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId; // Current logged-in user
    const receiverId = req.params.userId; // The person they are chatting with

    // Pagination support: ?page=1&limit=50
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const chatWhere = {
      OR: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    };

    // Run all queries in parallel — cuts ~60% latency vs sequential
    const [userExists, activeOrder, totalCount, chatHistory] = await Promise.all([
      // 1. Check if chat partner exists
      prisma.user.findUnique({ where: { id: receiverId } }),

      // 2. Check if chat is unlocked via an active order (₹6 booking fee paid)
      prisma.order.findFirst({
        where: {
          OR: [
            { buyerId: senderId, sellerId: receiverId },
            { buyerId: receiverId, sellerId: senderId }
          ],
          status: { in: ['PENDING', 'PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'] }
        }
      }),

      // 3. Count total messages for pagination metadata
      prisma.message.count({ where: chatWhere }),

      // 4. Fetch paginated chat history
      prisma.message.findMany({
        where: chatWhere,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      })
    ]);

    if (!userExists) {
      return res.status(404).json({ error: "Chat partner profile not found." });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      chatPartner: {
        id: userExists.id,
        username: userExists.username,
        name: userExists.name,
        avatarUrl: userExists.avatarUrl
      },
      isLocked: !activeOrder,
      count: chatHistory.length,
      history: chatHistory,
      page,
      totalPages,
      totalCount,
    });

  } catch (error) {
    console.error("Fetch Chat History Error:", error);
    return res.status(500).json({ error: "Failed to load chat history." });
  }
});

module.exports = router;
