const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * @route   POST /api/admin/login
 * @desc    Master Admin Login Verification
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: "admin-secret-session-token" });
  } else {
    return res.status(401).json({ error: "Invalid Admin Password" });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get real-time platform metrics and full management tables
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalGigs = await prisma.gig.count();
    const totalOrders = await prisma.order.count();
    const inProgressOrders = await prisma.order.count({
      where: { status: 'IN_PROGRESS' }
    });
    const pendingOrders = await prisma.order.count({
      where: { status: { in: ['PENDING', 'PENDING_ACCEPTANCE'] } }
    });
    const completedOrders = await prisma.order.count({
      where: { status: 'COMPLETED' }
    });
    const declinedOrders = await prisma.order.count({
      where: { status: 'DECLINED' }
    });

    // Calculate revenue metrics
    const orders = await prisma.order.findMany({
      select: { price: true, bookingFeePaid: true, status: true }
    });

    const bookingFeeRevenue = totalOrders * 6.0; // ₹6 platform fee per booking
    const totalGrossVolume = orders.reduce((sum, o) => sum + (o.price || 0), 0);

    // Fetch all users
    const allUsers = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isSeller: true,
        university: true,
        createdAt: true
      }
    });

    // Fetch all gigs
    const allGigs = await prisma.gig.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { name: true, username: true, email: true } }
      }
    });

    // Fetch all orders
    const allOrders = await prisma.order.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, username: true, email: true } },
        seller: { select: { name: true, username: true, email: true } },
        gig: { select: { title: true } }
      }
    });

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
    return res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

/**
 * @route   DELETE /api/admin/gigs/:id
 * @desc    Moderate/delete a gig listing
 */
router.delete('/gigs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.gig.delete({ where: { id } });
    return res.json({ message: "Gig deleted successfully." });
  } catch (error) {
    console.error("Admin Delete Gig Error:", error);
    return res.status(500).json({ error: "Failed to delete gig." });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User account deleted successfully." });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({ error: "Failed to delete user." });
  }
});

module.exports = router;
