const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const username = process.argv[2];

if (!username) {
  console.log("Usage: node set-admin.js <username>");
  process.exit(1);
}

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.error(`Error: User with username "${username}" not found.`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { username },
      data: { isAdmin: true }
    });

    console.log(`Success! User "${username}" is now set as an ADMIN.`);
  } catch (error) {
    console.error("Error setting admin role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
