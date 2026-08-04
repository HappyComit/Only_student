import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, getToken } from './api';

// ── Derive the WebSocket base URL from the API URL ──────────────────
// API_BASE_URL is like "http://10.208.44.27:5000/api" or "https://campushive-backend.onrender.com/api"
// Socket.IO needs the root: "http://10.208.44.27:5000" or "https://campushive-backend.onrender.com"
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/**
 * Connects to the Socket.IO server with JWT authentication.
 * Safe to call multiple times — will reuse the existing connection if already connected.
 */
export async function connectSocket(): Promise<Socket | null> {
  // Already connected — reuse
  if (socket?.connected) {
    return socket;
  }

  const token = await getToken();
  if (!token) {
    console.warn('⚡ Socket: No auth token — skipping connection');
    return null;
  }

  // Clean up any stale instance before reconnecting
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],   // Skip HTTP long-polling (faster on mobile)
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,     // Start at 1s
    reconnectionDelayMax: 10000, // Cap at 10s
    timeout: 15000,
  });

  socket.on('connect', () => {
    console.log('⚡ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('⚡ Socket disconnected:', reason);
  });

  socket.on('connect_error', (err: Error) => {
    console.warn('⚡ Socket connection error:', err.message);
  });

  return socket;
}

/**
 * Returns the current Socket.IO client instance (may be null if not connected).
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Cleanly disconnects and tears down the socket connection.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('⚡ Socket torn down');
  }
}
