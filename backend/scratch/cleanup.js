const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function run() {
  try {
    const all = await prisma.listing.findMany();
    console.log('Current listings:', all.map(l => l.title));

    const result = await prisma.listing.deleteMany({
      where: {
        title: {
          contains: 'Sony',
          mode: 'insensitive',
        },
      },
    });
    console.log(`Successfully deleted ${result.count} listings.`);
  } catch (error) {
    console.error('Error deleting listings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
