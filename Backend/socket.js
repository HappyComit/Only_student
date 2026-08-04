const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initializes Socket.IO on the given HTTP server.
 * Authenticates connections using the same JWT secret as the REST API.
 *
 * @param {import('http').Server} httpServer - The Node.js HTTP server instance
 * @returns {import('socket.io').Server} The Socket.IO server instance
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Skip HTTP long-polling — go straight to WebSocket (faster for mobile)
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication Middleware ──────────────────────────────────
  // Every connecting client must send a valid JWT token in the handshake.
  // This uses the exact same secret as authMiddleware.js.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'campushive_super_secret_security_key_2026_xyz'
      );
      // Attach user data to the socket for use in event handlers
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user.userId;

    // Join a private room named after the user's ID so we can target messages
    socket.join(`user:${userId}`);
    console.log(`🔌 Socket connected: ${userId} (socket ${socket.id})`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} — ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`🔌 Socket error for ${userId}:`, err.message);
    });
  });

  console.log('⚡ Socket.IO initialized and ready for connections');
  return io;
}

/**
 * Returns the current Socket.IO server instance.
 * Call this from route files to emit events.
 *
 * @returns {import('socket.io').Server | null}
 */
function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
