const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: 'FiMonitor' },
    { name: 'Cars', slug: 'cars', icon: 'FiTruck' },
    { name: 'Bikes', slug: 'bikes', icon: 'FiActivity' },
    { name: 'Tools & Equipment', slug: 'tools-equipment', icon: 'FiTool' },
    { name: 'Photography & Video', slug: 'photography-video', icon: 'FiVideo' },
    { name: 'Camping & Outdoors', slug: 'camping-outdoors', icon: 'FiMap' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Create a User
  const user = await prisma.user.upsert({
    where: { email: 'test@rentrex.local' },
    update: {},
    create: {
      email: 'test@rentrex.local',
      name: 'Test Host',
      bio: 'A verified local host with premium items.',
      role: 'ADMIN',
    },
  });

  // Create a Listing
  await prisma.listing.create({
    data: {
      ownerId: user.id,
      categoryId: (await prisma.category.findFirst({ where: { slug: 'photography-video' } })).id,
      title: 'Sony A7S III + 24-70mm GM Lens',
      description: 'Full-frame mirrorless camera perfect for low-light video production. Includes 2 batteries and a 128GB V90 card.',
      pricePerDay: 450000, // 4500.00 Rs
      deposit: 1000000, // 10000.00 Rs
      city: 'Mumbai',
      address: 'Andheri West',
      images: JSON.stringify(['https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=800']),
      available: true,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
