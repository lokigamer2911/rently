const { cleanupStalePendingBookings } = require('../src/utils/bookingCleanup');

describe('cleanupStalePendingBookings', () => {
  it('cancels expired pending bookings and releases the listing availability', async () => {
    const updates = [];
    const mockPrisma = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'booking-1', listingId: 'listing-1' },
          { id: 'booking-2', listingId: 'listing-2' },
        ]),
      },
      $transaction: jest.fn(async (callback) => {
        const tx = {
          booking: {
            update: jest.fn(async ({ where, data }) => {
              updates.push({ kind: 'booking', where, data });
              return {};
            }),
          },
          listing: {
            update: jest.fn(async ({ where, data }) => {
              updates.push({ kind: 'listing', where, data });
              return {};
            }),
          },
        };
        return callback(tx);
      }),
    };

    const result = await cleanupStalePendingBookings({
      prisma: mockPrisma,
      now: new Date('2026-07-16T12:00:00.000Z'),
      ttlMinutes: 30,
    });

    expect(result).toBe(2);
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          createdAt: { lt: new Date('2026-07-16T11:30:00.000Z') },
        }),
      })
    );
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'booking', data: { status: 'CANCELLED' } }),
        expect.objectContaining({ kind: 'listing', data: { available: true } }),
      ])
    );
  });
});
