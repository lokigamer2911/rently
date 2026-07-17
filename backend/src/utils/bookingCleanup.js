const cleanupStalePendingBookings = async ({ prisma, now = new Date(), ttlMinutes = 30 }) => {
  const cutoff = new Date(now.getTime() - ttlMinutes * 60 * 1000);

  const staleBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    select: { id: true, listingId: true },
  });

  if (!staleBookings.length) return 0;

  await Promise.all(
    staleBookings.map(async (booking) => {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED' },
        });

        await tx.listing.update({
          where: { id: booking.listingId },
          data: { available: true },
        });
      });
    })
  );

  return staleBookings.length;
};

module.exports = { cleanupStalePendingBookings };
