const { PrismaClient } = require('@prisma/client');

// Single shared PrismaClient instance to prevent connection pool exhaustion.
// Import this in every route file instead of calling `new PrismaClient()`.
const prisma = new PrismaClient();

module.exports = prisma;
