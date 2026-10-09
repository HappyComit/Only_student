const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authenticateToken = require('../middleware/authMiddleware');
const { sanitize } = require('../middleware/sanitize');

// In-memory feed cache (15-second TTL) to eliminate repetitive database queries
const feedCache = new Map();
const CACHE_TTL_MS = 15000;

function clearFeedCache() {
  feedCache.clear();
}

/**
 * @route   POST /api/gigs
 * @desc    Creates a new freelance gig listing (Secure route - Sellers only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, deliveryDays, imageUrl, category } = req.body;

    // 1. Authorization Check: Only users flagged as isSeller can post gigs
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!dbUser || !dbUser.isSeller) {
      return res.status(403).json({ 
        error: "Forbidden. Only registered Sellers can create gig listings. Please toggle 'isSeller' in your profile." 
      });
    }

    // 2. Input Validation
    if (!title || !description || price === undefined || !deliveryDays || !category) {
      return res.status(400).json({ 
        error: "Gig title, description, price, delivery days, and category are required." 
      });
    }

    if (price <= 0 || deliveryDays <= 0) {
      return res.status(400).json({ 
        error: "Price and delivery days must be positive numbers." 
      });
    }

    // 3. Create the Gig and link it to the authenticated user
    const newGig = await prisma.gig.create({
      data: {
        title: sanitize(title, 100),
        description: sanitize(description, 2000),
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays),
        imageUrl: imageUrl || "",
        category: sanitize(category, 30).toLowerCase().trim(), // Standardize category strings in lower-case
        sellerId: req.user.userId
      }
    });

    // Invalidate cached feed so newly posted gigs show up immediately
    clearFeedCache();

    return res.status(201).json({
      message: "Gig posted successfully!",
      gig: newGig
    });

  } catch (error) {
    console.error("Create Gig Error:", error);
    return res.status(500).json({ error: "Failed to post gig listing." });
  }
});

/**
 * @route   GET /api/gigs
 * @desc    Fetch all gigs with support for searching, category matching, filtering by seller, or checking featured gigs (Public)
 */
router.get('/', async (req, res) => {
  try {
    const { search, sellerId, featured, category } = req.query;
    
    // Check in-memory cache for fast response (0ms DB delay)
    const cacheKey = JSON.stringify({ search, sellerId, featured, category, page: req.query.page, limit: req.query.limit });
    const cachedEntry = feedCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
      return res.json(cachedEntry.data);
    }
    
    // Build dynamic query filters
    const whereConditions = {};

    // Filter by seller if sellerId is provided in query
    if (sellerId) {
      whereConditions.sellerId = sellerId;
    }

    // Filter by category if category query is provided (e.g. ?category=dev)
    if (category) {
      whereConditions.category = category.toLowerCase().trim();
    }

    // Filter by featured status if ?featured=true
    if (featured === 'true') {
      whereConditions.isFeatured = true;
    }

    // Search filter: looks for keyword matches inside the Title OR Description (case-insensitive)
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Pagination support: ?page=1&limit=20
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Run count + data query in parallel (saves one round-trip)
    const [totalCount, gigs] = await Promise.all([
      prisma.gig.count({ where: whereConditions }),
      prisma.gig.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' }, // Newest gigs first
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              username: true,
              name: true,
              avatarUrl: true,
              upiId: true,
              university: true,
              year: true,
              skills: true,
              responseTime: true,
              isVerified: true
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const responsePayload = { count: gigs.length, gigs, page, totalPages, totalCount };

    // Save payload to in-memory cache (cap at 100 unique keys to prevent unbounded growth)
    if (feedCache.size >= 100) feedCache.clear();
    feedCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });

    return res.json(responsePayload);

  } catch (error) {
    console.error("Fetch Gigs Error:", error);
    return res.status(500).json({ error: "Failed to load gigs feed." });
  }
});

/**
 * @route   GET /api/gigs/:id
 * @desc    Fetch details of a single gig (Public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find gig by ID and load full seller profile
    const gig = await prisma.gig.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bio: true,
            avatarUrl: true,
            upiId: true,
            university: true,
            year: true,
            skills: true,
            responseTime: true,
            isVerified: true
          }
        }
      }
    });

    if (!gig) {
      return res.status(404).json({ error: "Gig listing not found." });
    }

    // Count completed/active orders for this seller
    const completedOrdersCount = await prisma.order.count({
      where: {
        sellerId: gig.sellerId,
        status: { in: ['COMPLETED', 'IN_PROGRESS', 'DELIVERED'] }
      }
    });

    return res.json({ gig, completedOrdersCount });

  } catch (error) {
    console.error("Fetch Gig Detail Error:", error);
    return res.status(500).json({ error: "Failed to load gig details." });
  }
});

module.exports = router;
module.exports.clearFeedCache = clearFeedCache;
