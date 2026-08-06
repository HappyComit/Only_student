const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

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
    // Keepalive heartbeats so Render proxy does not drop WebSockets
    pingInterval: 10000, // 10s heartbeat
    pingTimeout: 20000,
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
        process.env.JWT_SECRET
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
    logger.socket(`Connected: user ${userId} (socket ID: ${socket.id})`);

    socket.on('disconnect', (reason) => {
      logger.socket(`Disconnected: user ${userId} — Reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error('SOCKET', `Error for user ${userId}: ${err.message}`);
    });
  });

  logger.info('SOCKET', 'Socket.IO initialized and ready for connections');
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
