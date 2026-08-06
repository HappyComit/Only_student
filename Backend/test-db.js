require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error', 'warn'] });

async function test() {
  try {
    await p.$connect();
    console.log('DB CONNECTED OK');
    const user = await p.user.findFirst();
    console.log('Query OK, user:', user ? user.email : 'no users yet');
  } catch (e) {
    console.error('DB ERROR:', e.message);
    console.error('Code:', e.code);
    console.error('Meta:', e.meta);
  } finally {
    await p.$disconnect();
    process.exit(0);
  }
}

test();
