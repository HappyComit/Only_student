const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');

/**
 * Helper function to create a notification in the DB
 */
async function createNotification({ userId, title, message, type = 'GENERAL', relatedId = null }) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * @route   GET /api/notifications
 * @desc    Fetch all notifications for logged-in user + unread count
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;

    const where = { userId };

    const [totalCount, notifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      notifications,
      unreadCount,
      page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({ notification: updated });
  } catch (error) {
    console.error('Mark Read Error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for logged-in user
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
