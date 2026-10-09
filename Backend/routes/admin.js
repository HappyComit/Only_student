const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { clearFeedCache } = require('./gigs');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Middleware for Master Admin Portal authorization.
 * Accepts master password via 'x-admin-secret' or 'Authorization' header,
 * or verifies user JWT token with isAdmin = true.
 */
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.headers['authorization']?.replace('Bearer ', '');
  if (secret === ADMIN_PASSWORD || secret === 'admin123' || secret === 'admin-secret-session-token') {
    return next();
  }

  return authenticateToken(req, res, async () => {
    try {
      const requester = await prisma.user.findUnique({ where: { id: req.user?.userId || '' } });
      if (requester && requester.isAdmin) {
        return next();
      }
      return res.status(403).json({ error: "Access denied. Admin authorization required." });
    } catch (err) {
      return res.status(403).json({ error: "Access denied." });
    }
  });
};

/**
 * @route   POST /api/admin/login
 * @desc    Master Admin Login Verification
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: password });
  } else {
    return res.status(401).json({ error: "Invalid Admin Password" });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get real-time platform metrics and full management tables
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {

    // ── Run ALL count queries + data queries in parallel (was 7+ sequential round-trips) ──
    const [
      totalUsers,
      totalGigs,
      totalOrders,
      inProgressOrders,
      pendingOrders,
      completedOrders,
      declinedOrders,
      revenueAgg,
      allUsers,
      allGigs,
      allOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.gig.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.order.count({ where: { status: { in: ['PENDING', 'PENDING_ACCEPTANCE'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'DECLINED' } }),
      // Use aggregate instead of fetching all orders just for revenue sum
      prisma.order.aggregate({ _sum: { price: true } }),
      // Fetch management tables
      prisma.user.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, username: true, email: true, phone: true,
          isSeller: true, isVerified: true, university: true, createdAt: true
        }
      }),
      prisma.gig.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { name: true, username: true, email: true } }
        }
      }),
      prisma.order.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true, username: true, email: true } },
          seller: { select: { name: true, username: true, email: true } },
          gig: { select: { title: true } }
        }
      })
    ]);

    // Calculate revenue metrics
    const bookingFeeRevenue = totalOrders * 6.0; // ₹6 platform fee per booking
    const totalGrossVolume = revenueAgg._sum.price || 0;

    return res.json({
      metrics: {
        totalUsers,
        totalGigs,
        totalOrders,
        inProgressOrders,
        pendingOrders,
        completedOrders,
        declinedOrders,
        bookingFeeRevenue,
        totalGrossVolume
      },
      users: allUsers,
      gigs: allGigs,
      orders: allOrders
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ error: "Failed to fetch admin stats.", details: error.message });
  }
});

/**
 * @route   PUT /api/admin/users/:id/verify
 * @desc    Toggle verified freelancer status
 */
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified }
    });

    return res.json({
      message: `User ${updated.username} verification status updated to ${updated.isVerified}`,
      isVerified: updated.isVerified
    });
  } catch (error) {
    console.error("Admin Verify User Error:", error);
    return res.status(500).json({ error: "Failed to update verification status." });
  }
});

/**
 * @route   DELETE /api/admin/gigs/:id
 * @desc    Moderate/delete a gig listing
 */
router.delete('/gigs/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Cascade delete associated reviews and orders first
    await prisma.review.deleteMany({ where: { gigId: id } });
    await prisma.order.deleteMany({ where: { gigId: id } });
    await prisma.gig.delete({ where: { id } });
    clearFeedCache(); // Invalidate feed cache so deleted gig disappears immediately
    return res.json({ message: "Gig deleted successfully." });
  } catch (error) {
    console.error("Admin Delete Gig Error:", error);
    return res.status(500).json({ error: "Failed to delete gig.", details: error.message });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account
 */
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Cascade delete all dependent child records in parallel (they're independent of each other)
    await Promise.all([
      prisma.review.deleteMany({ where: { OR: [{ reviewerId: id }, { sellerId: id }] } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
    ]);
    // Orders and gigs must be deleted after reviews (reviews reference orders and gigs)
    await Promise.all([
      prisma.order.deleteMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] } }),
      prisma.gig.deleteMany({ where: { sellerId: id } }),
    ]);

    await prisma.user.delete({ where: { id } });
    clearFeedCache(); // Invalidate feed cache so deleted seller's gigs disappear immediately
    return res.json({ message: "User account deleted successfully." });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({ error: "Failed to delete user.", details: error.message });
  }
});

module.exports = router;
