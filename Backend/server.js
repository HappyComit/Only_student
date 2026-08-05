// Load environment variables from our .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initSocket } = require('./socket');

// Import our route files
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy headers (required on Render/Cloudflare for rate limiting)
app.set('trust proxy', 1);

// ==========================================
// MIDDLEWARES
// ==========================================

// Custom CORS (Cross-Origin Resource Sharing) middleware to allow our frontend to talk to the backend
// This allows the browser/device to make requests and share cookies securely
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  // Handle preflight OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to parse incoming JSON request bodies (e.g. req.body)
// Note: Increased payload limit for large uploads/data
app.use(express.json({ limit: '10mb' }));

// Middleware to parse URL-encoded bodies (often used in forms)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to read cookies sent along with incoming HTTP requests
app.use(cookieParser());

// Static file middleware for admin portal
app.use('/public', express.static(path.join(__dirname, 'public')));

// ==========================================
// RATE LIMITING (Disabled for unlimited testing)
// ==========================================

// Global API Rate Limiter — set high threshold for testing (10,000 requests)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10000,                  // Unlimited / 10,000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Limiter — set high threshold for testing (10,000 requests)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10000,                  // Unlimited / 10,000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global limiter to ALL /api endpoints
app.use('/api', globalLimiter);

// Apply strict limiter specifically to auth routes (runs BEFORE the auth router)
app.use('/api/auth', authLimiter);

// ==========================================
// ROUTES
// ==========================================

// Welcome/Health-Check route
app.get('/', (req, res) => {
  res.json({ 
    message: "Welcome to the CampusHive API!",
    status: "Healthy",
    time: new Date()
  });
});

// Mount our structured API endpoints under '/api' prefix
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Master Web Admin Portal
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Global Error Handler middleware to capture and return errors nicely instead of crashing the server
app.use((err, req, res, next) => {
  console.error("Global Server Error:", err.stack);
  res.status(500).json({ 
    error: "An unexpected error occurred on the server.", 
    details: err.message 
  });
});

// ==========================================
// START SERVER (HTTP + Socket.IO)
// ==========================================
const server = http.createServer(app);

// Initialize Socket.IO on the same HTTP server
initSocket(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🐝 CampusHive Backend Server started successfully!`);
  console.log(` 🚀 Running on: http://localhost:${PORT}`);
  console.log(` ⚡ Socket.IO: WebSocket connections enabled`);
  console.log(`====================================================`);
});
