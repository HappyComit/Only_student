const { PrismaClient } = require('@prisma/client');

// Single shared PrismaClient instance to prevent connection pool exhaustion.
// Import this in every route file instead of calling `new PrismaClient()`.
const prisma = new PrismaClient({
  // Enable query logging in development to identify slow queries
  log: process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['query', 'warn', 'error'],
});

module.exports = prisma;
