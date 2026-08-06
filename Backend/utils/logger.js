/**
 * CampusHive Structured Logger Utility
 * Provides standardized, categorized console logging with ISO timestamps and icons
 * for easy filtering in Render / cloud logs.
 */

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info: (tag, message, ...args) => {
    console.log(`[${formatTimestamp()}] [${tag.toUpperCase()}] ℹ️  ${message}`, ...args);
  },

  success: (tag, message, ...args) => {
    console.log(`[${formatTimestamp()}] [${tag.toUpperCase()}] ✅ ${message}`, ...args);
  },

  warn: (tag, message, ...args) => {
    console.warn(`[${formatTimestamp()}] [${tag.toUpperCase()}] ⚠️  ${message}`, ...args);
  },

  error: (tag, message, ...args) => {
    console.error(`[${formatTimestamp()}] [${tag.toUpperCase()}] ❌ ${message}`, ...args);
  },

  http: (method, url, status, durationMs) => {
    const icon = status >= 400 ? '❌' : '🌐';
    console.log(`[${formatTimestamp()}] [HTTP] ${icon} ${method} ${url} - Status: ${status} (${durationMs}ms)`);
  },

  socket: (message, ...args) => {
    console.log(`[${formatTimestamp()}] [SOCKET] 🔌 ${message}`, ...args);
  },

  cron: (message, ...args) => {
    console.log(`[${formatTimestamp()}] [CRON] ⏰ ${message}`, ...args);
  },

  db: (message, ...args) => {
    console.log(`[${formatTimestamp()}] [DATABASE] 🗄️ ${message}`, ...args);
  }
};

module.exports = logger;
