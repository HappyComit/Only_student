const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { getIO } = require('../socket');
const { sanitize } = require('../middleware/sanitize');

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

    // 3. Run receiver check and order lookup in PARALLEL (saves one round-trip)
    const [receiverExists, matchingOrders] = await Promise.all([
      prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } }),
      // Single query to find any active order — replaces two sequential findFirst calls
      prisma.order.findMany({
        where: {
          OR: [
            { buyerId: senderId, sellerId: receiverId },
            { buyerId: receiverId, sellerId: senderId }
          ],
          bookingFeePaid: true,
          status: { in: ['PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Only need a few to determine status
        select: { id: true, status: true }
      })
    ]);

    if (!receiverExists) {
      return res.status(404).json({ error: "Recipient user not found." });
    }

    // Prioritize PENDING_ACCEPTANCE, then fallback to any active order
    const activeOrder = matchingOrders.find(o => o.status === 'PENDING_ACCEPTANCE')
      || matchingOrders.find(o => ['IN_PROGRESS', 'DELIVERED', 'COMPLETED'].includes(o.status))
      || null;

    if (!activeOrder) {
      return res.status(403).json({
        error: "Chat Section Locked! 🔒 You must place a hire request (₹6 platform booking fee) to unlock chat with this user.",
        isLocked: true
      });
    }

    // 3.6 Block sending messages if order is DELIVERED or COMPLETED (read-only mode)
    if (activeOrder.status === 'DELIVERED' || activeOrder.status === 'COMPLETED') {
      return res.status(403).json({
        error: "This chat is now read-only. The order has been completed. To chat again, place a new hire request.",
        isReadOnly: true
      });
    }

    // 4. Save the message to the database
    // isRead = false because the RECEIVER hasn't seen this message yet.
    // The sender's own messages are identified in the UI via senderId, not isRead.
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: sanitize(content.trim(), 1000),
        isRead: false
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
 *          OPTIMIZED: Uses raw SQL DISTINCT ON to get only the latest message per partner
 *          instead of fetching ALL messages into memory and grouping in JavaScript.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ── Step 1: Get the latest message per conversation partner using DISTINCT ON ──
    // This runs entirely in the database — only returns 1 row per partner (not all messages)
    const latestMessages = await prisma.$queryRaw`
      SELECT DISTINCT ON (partner_id)
        id,
        "senderId",
        "receiverId",
        content,
        "isRead",
        "createdAt",
        CASE
          WHEN "senderId" = ${userId} THEN "receiverId"
          ELSE "senderId"
        END AS partner_id
      FROM "Message"
      WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
      ORDER BY partner_id, "createdAt" DESC
    `;

    if (!latestMessages || latestMessages.length === 0) {
      return res.json({ count: 0, threads: [], page: 1, totalPages: 0, totalCount: 0 });
    }

    const partnerIds = latestMessages.map(m => m.partner_id);

    // ── Step 2: Fetch partner user details and unread counts in parallel ──
    const [partners, unreadCounts] = await Promise.all([
      prisma.user.findMany({
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
      }),
      // Count unread messages per partner (messages SENT BY partner TO current user that are unread)
      prisma.message.groupBy({
        by: ['senderId'],
        where: {
          receiverId: userId,
          senderId: { in: partnerIds },
          isRead: false
        },
        _count: { id: true }
      })
    ]);

    // Build lookup maps
    const partnerMap = new Map();
    for (const p of partners) {
      partnerMap.set(p.id, p);
    }

    const unreadMap = new Map();
    for (const entry of unreadCounts) {
      unreadMap.set(entry.senderId, entry._count.id);
    }

    // ── Step 3: Build thread objects (already sorted by createdAt DESC from SQL) ──
    const threads = latestMessages
      .filter(msg => partnerMap.has(msg.partner_id)) // Safety: skip if partner was deleted
      .map(msg => ({
        id: msg.partner_id,
        counterpart: partnerMap.get(msg.partner_id),
        latestMessage: {
          id: msg.id,
          text: msg.content,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          receiverId: msg.receiverId
        },
        unreadCount: unreadMap.get(msg.partner_id) || 0
      }));

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

    const orderWhere = {
      OR: [
        { buyerId: senderId, sellerId: receiverId },
        { buyerId: receiverId, sellerId: senderId }
      ],
      bookingFeePaid: true,
    };

    // Run all queries in parallel with selective column fetching for maximum speed
    const [userExists, pendingOrder, fallbackOrder, totalCount, chatHistory] = await Promise.all([
      // 1. Check if chat partner exists (only fetch required profile fields)
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, username: true, name: true, avatarUrl: true }
      }),

      // 2a. PRIORITY: Find PENDING_ACCEPTANCE order (new hire request awaiting seller action)
      prisma.order.findFirst({
        where: { ...orderWhere, status: 'PENDING_ACCEPTANCE' },
        select: { id: true, buyerId: true, sellerId: true, status: true, price: true, bookingFee: true },
        orderBy: { createdAt: 'desc' }
      }),

      // 2b. FALLBACK: Find any other active order (chat stays unlocked)
      prisma.order.findFirst({
        where: { ...orderWhere, status: { in: ['IN_PROGRESS', 'DELIVERED', 'COMPLETED'] } },
        select: { id: true, buyerId: true, sellerId: true, status: true, price: true, bookingFee: true },
        orderBy: { createdAt: 'desc' }
      }),

      // 3. Count total messages for pagination metadata
      prisma.message.count({ where: chatWhere }),

      // 4. Fetch paginated chat history (only needed message columns)
      prisma.message.findMany({
        where: chatWhere,
        select: { id: true, senderId: true, receiverId: true, content: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      })
    ]);

    // Prioritize PENDING_ACCEPTANCE order so seller sees accept/reject buttons
    const activeOrder = pendingOrder || fallbackOrder;


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
      isReadOnly: activeOrder ? (activeOrder.status === 'DELIVERED' || activeOrder.status === 'COMPLETED') : false,
      activeOrder: activeOrder ? {
        id: activeOrder.id,
        buyerId: activeOrder.buyerId,
        sellerId: activeOrder.sellerId,
        status: activeOrder.status,
        price: activeOrder.price,
        bookingFee: activeOrder.bookingFee
      } : null,
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

/**
 * @route   PUT /api/messages/:userId/read
 * @desc    Marks all unread messages from a specific partner as read (Secure route)
 */
router.put('/:userId/read', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const partnerId = req.params.userId;

    // Mark all messages from this partner to current user as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: currentUserId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Notify both users so their thread lists refresh with updated badge counts
    const io = getIO();
    if (io && result.count > 0) {
      io.to(`user:${currentUserId}`).to(`user:${partnerId}`).emit('threads_updated');
    }

    return res.json({
      message: "Messages marked as read.",
      markedCount: result.count
    });
  } catch (error) {
    console.error("Mark Messages Read Error:", error);
    return res.status(500).json({ error: "Failed to mark messages as read." });
  }
});

module.exports = router;
