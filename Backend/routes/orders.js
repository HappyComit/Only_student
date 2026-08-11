const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { createNotification } = require('./notifications');

/**
 * @route   POST /api/orders
 * @desc    Creates a new order for a gig (Secure route - Buyer initiates)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { gigId, bookingTransactionId } = req.body;
    const buyerId = req.user.userId;

    if (!gigId) {
      return res.status(400).json({ error: "Gig ID is required to place an order." });
    }

    // 1. Fetch the gig details to ensure it exists and to get the price and seller details
    const gig = await prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) {
      return res.status(404).json({ error: "Gig not found." });
    }

    // 2. Prevent a seller from buying their own gig
    if (gig.sellerId === buyerId) {
      return res.status(400).json({ error: "You cannot purchase your own gig listing." });
    }

    // Fetch buyer details for notification text
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });

    // 3. Calculate target delivery date (current date + gig delivery days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + gig.deliveryDays);

    // 4. Insert the new order into the database
    // Initial status is PENDING_ACCEPTANCE if booking fee is paid, or PENDING
    const isFeePaid = Boolean(bookingTransactionId);
    const initialStatus = isFeePaid ? "PENDING_ACCEPTANCE" : "PENDING";

    const order = await prisma.order.create({
      data: {
        gigId: gig.id,
        buyerId: buyerId,
        sellerId: gig.sellerId,
        price: gig.price,
        bookingFee: 6.0, // Default platform fee
        status: initialStatus,
        bookingFeePaid: isFeePaid,
        bookingTransactionId: bookingTransactionId || null,
        deliveryDate: deliveryDate
      },
      include: {
        gig: { select: { title: true } },
        seller: { select: { username: true, name: true, upiId: true } },
        buyer: { select: { username: true, name: true } }
      }
    });

    // Notify seller of new hire request ONLY if booking fee was paid upfront
    if (isFeePaid) {
      await createNotification({
        userId: gig.sellerId,
        title: "New Job Request! 🔔",
        message: `${buyer?.name || buyer?.username || 'A student'} placed an order for '${gig.title}' (₹6 platform fee paid). Please accept or decline.`,
        type: "ORDER_REQUEST",
        relatedId: order.id
      });
    }

    return res.status(201).json({
      message: "Hire request placed successfully! Sent to seller for acceptance.",
      order
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ error: "Failed to place order." });
  }
});

/**
 * @route   POST /api/orders/:id/pay-booking
 * @desc    Simulate/Confirm payment of the ₹9 platform booking fee (Secure route - Buyer pays)
 */
router.post('/:id/pay-booking', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingTransactionId } = req.body; // The UPI Ref No. (e.g., GPay transaction number)
    const buyerId = req.user.userId;

    if (!bookingTransactionId) {
      return res.status(400).json({ error: "UPI transaction ID is required." });
    }

    // 1. Fetch the order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // 2. Security Check: Only the buyer of this order can pay the booking fee
    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Unauthorized. You are not the buyer of this order." });
    }

    // 3. Ensure order is in PENDING state
    if (order.status !== "PENDING") {
      return res.status(400).json({ error: `Cannot process payment. Order is already ${order.status}` });
    }

    // 4. Update order to PENDING_ACCEPTANCE and mark booking fee paid
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        bookingFeePaid: true,
        bookingTransactionId,
        status: "PENDING_ACCEPTANCE"
      },
      include: { gig: true, buyer: true, seller: true }
    });

    // Notify seller of new hire request
    await createNotification({
      userId: order.sellerId,
      title: "New Job Request! 🔔",
      message: `${updatedOrder.buyer?.name || updatedOrder.buyer?.username || 'A student'} paid the ₹6 platform fee and hired you for '${updatedOrder.gig?.title}'. Please accept or decline.`,
      type: "ORDER_REQUEST",
      relatedId: order.id
    });

    return res.json({
      message: "Platform booking fee confirmed! Hire request sent to seller.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Booking Payment Error:", error);
    return res.status(500).json({ error: "Failed to process booking fee payment." });
  }
});

/**
 * @route   POST /api/orders/:id/accept
 * @desc    Seller accepts a pending order request (Secure route - Seller accepts)
 */
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { gig: true, buyer: true, seller: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: "Unauthorized. You are not the seller of this order." });
    }

    if (order.status !== "PENDING_ACCEPTANCE" && order.status !== "PENDING") {
      return res.status(400).json({ error: `Cannot accept order in status '${order.status}'.` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "IN_PROGRESS" }
    });

    // Send notification to buyer
    await createNotification({
      userId: order.buyerId,
      title: "Order Request Accepted! 🎉",
      message: `Great news! ${order.seller?.name || order.seller?.username || 'The seller'} accepted your order for '${order.gig?.title}'. Work is now IN_PROGRESS!`,
      type: "ORDER_ACCEPTED",
      relatedId: order.id
    });

    return res.json({
      message: "Order request accepted! Project is now IN_PROGRESS.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Accept Order Error:", error);
    return res.status(500).json({ error: "Failed to accept order." });
  }
});

/**
 * @route   POST /api/orders/:id/decline
 * @desc    Seller declines a pending order request (Secure route - Seller declines)
 */
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { gig: true, buyer: true, seller: true }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: "Unauthorized. You are not the seller of this order." });
    }

    if (order.status !== "PENDING_ACCEPTANCE" && order.status !== "PENDING") {
      return res.status(400).json({ error: `Cannot decline order in status '${order.status}'.` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "DECLINED" }
    });

    // Send notification to buyer
    await createNotification({
      userId: order.buyerId,
      title: "Order Request Declined ❌",
      message: `${order.seller?.name || order.seller?.username || 'The seller'} is currently unavailable and declined your order request for '${order.gig?.title}'.`,
      type: "ORDER_DECLINED",
      relatedId: order.id
    });

    return res.json({
      message: "Order request declined.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Decline Order Error:", error);
    return res.status(500).json({ error: "Failed to decline order." });
  }
});

/**
 * @route   POST /api/orders/:id/deliver
 * @desc    Seller marks order as delivered (Secure route - Seller submits work)
 */
router.post('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;

    // 1. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { gig: true, seller: true }
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // 2. Security Check: Only the designated seller can deliver work
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: "Unauthorized. You are not the seller of this order." });
    }

    // 3. Ensure order is currently IN_PROGRESS
    if (order.status !== "IN_PROGRESS") {
      return res.status(400).json({ error: `Cannot deliver. Order status must be IN_PROGRESS (current: ${order.status})` });
    }

    // 4. Update status to DELIVERED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "DELIVERED" }
    });

    // Notify buyer
    await createNotification({
      userId: order.buyerId,
      title: "Work Delivered! 📦",
      message: `${order.seller?.name || order.seller?.username || 'Seller'} delivered the work for '${order.gig?.title}'. Please complete payment to unlock files.`,
      type: "ORDER_DELIVERED",
      relatedId: order.id
    });

    return res.json({
      message: "Work marked as Delivered! Waiting for buyer's final payment to complete.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Delivery Error:", error);
    return res.status(500).json({ error: "Failed to submit delivery." });
  }
});

/**
 * @route   POST /api/orders/:id/pay-gig
 * @desc    Confirm payment of final gig price directly to seller's UPI (Secure route - Buyer pays)
 */
router.post('/:id/pay-gig', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { gigTransactionId } = req.body; // The UPI Ref No. of final payment to seller
    const buyerId = req.user.userId;

    if (!gigTransactionId) {
      return res.status(400).json({ error: "UPI transaction ID for the seller payment is required." });
    }

    // 1. Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { gig: true, buyer: true }
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // 2. Security Check: Only the buyer can pay the final gig price
    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Unauthorized. You are not the buyer of this order." });
    }

    // 3. Ensure order is in DELIVERED state (seller has completed the work)
    if (order.status !== "DELIVERED") {
      return res.status(400).json({ error: `Cannot make final payment. Order must be DELIVERED first (current: ${order.status}).` });
    }

    // 4. Update status to COMPLETED and unlock final files
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        gigPricePaid: true,
        gigTransactionId,
        status: "COMPLETED"
      }
    });

    // Notify seller of payment completion
    await createNotification({
      userId: order.sellerId,
      title: "Payment Received & Order Completed! 💰",
      message: `${order.buyer?.name || order.buyer?.username || 'Buyer'} completed payment for '${order.gig?.title}'. The project is officially completed!`,
      type: "ORDER_COMPLETED",
      relatedId: order.id
    });

    return res.json({
      message: "Final payment confirmed! The project is officially COMPLETED.",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Final Payment Error:", error);
    return res.status(500).json({ error: "Failed to process final payment." });
  }
});

/**
 * @route   GET /api/orders/buyer
 * @desc    Retrieve all orders placed by the current logged-in buyer (Secure route)
 */
router.get('/buyer', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { buyerId: req.user.userId };
    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          gig: { select: { title: true, imageUrl: true } },
          seller: { select: { username: true, name: true, upiId: true } },
          review: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return res.json({ count: orders.length, orders, page, totalPages, totalCount });
  } catch (error) {
    console.error("Fetch Buyer Orders Error:", error);
    return res.status(500).json({ error: "Failed to load buyer orders." });
  }
});

/**
 * @route   GET /api/orders/seller
 * @desc    Retrieve all orders assigned to the current logged-in seller (Secure route)
 */
router.get('/seller', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { sellerId: req.user.userId };
    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          gig: { select: { title: true, imageUrl: true } },
          buyer: { select: { username: true, name: true } },
          review: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return res.json({ count: orders.length, orders, page, totalPages, totalCount });
  } catch (error) {
    console.error("Fetch Seller Orders Error:", error);
    return res.status(500).json({ error: "Failed to load seller orders." });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Fetch details of a single order (Secure route - Buyer or Seller only)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        gig: true,
        buyer: { select: { id: true, username: true, email: true } },
        seller: { select: { id: true, username: true, email: true, upiId: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Verify caller is either the buyer or the seller of this order
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: "Access Denied. You are not a party to this order." });
    }

    return res.json({ order });

  } catch (error) {
    console.error("Fetch Order Detail Error:", error);
    return res.status(500).json({ error: "Failed to load order details." });
  }
});

module.exports = router;
