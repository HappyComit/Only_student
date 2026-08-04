const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');

// Initialize Razorpay client with environment credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

/**
 * @route   GET /api/payments/razorpay/key
 * @desc    Retrieves the public Razorpay Key ID for frontend Checkout SDK
 */
router.get('/razorpay/key', (req, res) => {
  return res.json({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  });
});

/**
 * @route   POST /api/payments/razorpay/create-order
 * @desc    Creates a Razorpay Order for booking fee (₹9) or full gig price (Secure route - Buyer)
 */
router.post('/razorpay/create-order', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentType } = req.body; // paymentType: 'booking' | 'gig'
    const buyerId = req.user.userId;

    if (!orderId || !paymentType) {
      return res.status(400).json({ error: "orderId and paymentType ('booking' or 'gig') are required." });
    }

    // 1. Fetch order details from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        gig: { select: { title: true } },
        seller: { select: { name: true, username: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // 2. Security Check: Only buyer can make payments
    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Unauthorized. Only the order buyer can initiate payment." });
    }

    // 3. Determine amount in Paise (1 INR = 100 Paise)
    let amountInPaise = 0;
    if (paymentType === 'booking') {
      if (order.status !== 'PENDING') {
        return res.status(400).json({ error: `Cannot pay booking fee. Order is already ${order.status}` });
      }
      amountInPaise = Math.round((order.bookingFee || 9) * 100);
    } else if (paymentType === 'gig') {
      if (order.status !== 'DELIVERED') {
        return res.status(400).json({ error: `Cannot pay final gig price. Work must be DELIVERED first (current: ${order.status})` });
      }
      amountInPaise = Math.round(order.price * 100);
    } else {
      return res.status(400).json({ error: "Invalid paymentType. Must be 'booking' or 'gig'." });
    }

    // 4. Call Razorpay API to generate order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${order.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        orderId: order.id,
        paymentType,
        gigTitle: order.gig?.title || 'CampusHive Service',
      },
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (rzpErr) {
      console.warn("Razorpay API warning (using mock order ID for testing if keys not configured):", rzpErr.message);
      // Fallback for local dev when real API keys are not provided yet
      razorpayOrder = {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: amountInPaise,
        currency: "INR",
      };
    }

    return res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      orderId: order.id,
      paymentType,
      gigTitle: order.gig?.title || 'CampusHive Service',
    });

  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return res.status(500).json({ error: "Failed to create Razorpay payment order." });
  }
});

/**
 * @route   POST /api/payments/razorpay/verify-signature
 * @desc    Cryptographically verifies Razorpay signature and updates DB order status (Secure route)
 */
router.post('/razorpay/verify-signature', authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentType, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const buyerId = req.user.userId;

    if (!orderId || !paymentType || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing required payment verification details." });
    }

    // 1. Fetch order
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Unauthorized caller." });
    }

    // 2. Cryptographic HMAC SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    let isValid = false;

    if (razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    }

    // Dev fallback if using mock payment ID on emulator or test keys
    if (!isValid && (razorpay_payment_id.startsWith('pay_mock_') || secret === 'placeholder_secret') && process.env.NODE_ENV !== 'production') {
      console.log("ℹ️ Dev Mode / Simulated Razorpay verification accepted.");
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: "Invalid Razorpay payment signature. Payment verification failed." });
    }

    // 3. Update order in database based on payment type
    let updatedOrder;
    if (paymentType === 'booking') {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          bookingFeePaid: true,
          bookingTransactionId: razorpay_payment_id,
          status: "IN_PROGRESS",
        },
      });
    } else if (paymentType === 'gig') {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          gigPricePaid: true,
          gigTransactionId: razorpay_payment_id,
          status: "COMPLETED",
        },
      });
    }

    return res.json({
      success: true,
      message: `Razorpay payment verified! Order status updated to ${updatedOrder.status}.`,
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Razorpay Verify Signature Error:", error);
    return res.status(500).json({ error: "Payment verification failed." });
  }
});

module.exports = router;
