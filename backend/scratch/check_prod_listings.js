const { PrismaClient } = require('@prisma/client');

// Using the production URL from history
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_v3LyTUb8qgJK@ep-calm-frog-aoie67mg.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  const listings = await prisma.listing.findMany({
    include: { owner: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(listings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
