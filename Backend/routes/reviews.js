const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { sanitize } = require('../middleware/sanitize');

/**
 * @route   POST /api/reviews
 * @desc    Creates a review for a completed order (Secure route)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const reviewerId = req.user.userId;

    if (!orderId || !rating) {
      return res.status(400).json({ error: "Order ID and rating are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }

    // 1. Verify the order exists and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: "You can only review services that have been fully paid and completed." });
    }

    // 2. Verify the requester is the buyer of the order
    if (order.buyerId !== reviewerId) {
      return res.status(403).json({ error: "Access denied. Only the buyer can write a review for this order." });
    }

    // 3. Verify that a review doesn't already exist for this order
    const existingReview = await prisma.review.findUnique({
      where: { orderId }
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already submitted a review for this order." });
    }

    // 4. Create the review
    const newReview = await prisma.review.create({
      data: {
        orderId,
        gigId: order.gigId,
        reviewerId,
        sellerId: order.sellerId,
        rating: parseInt(rating),
        comment: sanitize(comment || "", 500)
      }
    });

    return res.status(201).json({
      message: "Review submitted successfully!",
      review: newReview
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    return res.status(500).json({ error: "Failed to submit review." });
  }
});

/**
 * @route   GET /api/reviews/gig/:gigId
 * @desc    Retrieves all reviews for a specific gig listing
 */
router.get('/gig/:gigId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { gigId: req.params.gigId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ count: reviews.length, reviews });
  } catch (error) {
    console.error("Get Gig Reviews Error:", error);
    return res.status(500).json({ error: "Failed to load gig reviews." });
  }
});

/**
 * @route   GET /api/reviews/seller/:sellerId
 * @desc    Retrieves all reviews received by a freelancer
 */
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { sellerId: req.params.sellerId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ count: reviews.length, reviews });
  } catch (error) {
    console.error("Get Seller Reviews Error:", error);
    return res.status(500).json({ error: "Failed to load seller reviews." });
  }
});

module.exports = router;
