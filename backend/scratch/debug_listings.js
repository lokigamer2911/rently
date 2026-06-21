const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking categories...');
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories);

    console.log('\nChecking listings...');
    const listings = await prisma.listing.findMany({
      include: { category: true }
    });
    console.log('Total listings:', listings.length);
    if (listings.length > 0) {
        console.log('First listing:', JSON.stringify(listings[0], null, 2));
    }

    console.log('\nChecking users...');
    const users = await prisma.user.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => console.log(`User: ${u.email} (${u.id})`));

  } catch (e) {
    console.error('Error during debug:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
