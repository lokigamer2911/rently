const express = require('express');
const request = require('supertest');

jest.mock('../src/config/prisma', () => ({
  booking: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  listing: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  alert: {
    findMany: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/utils/notifications', () => ({
  createNotification: jest.fn(),
  notifyWaitlist: jest.fn(),
}));

jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, _res, next) => {
    const userId = req.headers['x-user-id'] || 'user-1';
    req.user = { id: userId };
    next();
  },
}));

const prisma = require('../src/config/prisma');
const bookingRoutes = require('../src/routes/booking.routes');

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('Booking state transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a booking and transition to confirmed', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: 'listing-1',
      available: true,
      ownerId: 'owner-1',
      pricePerDay: 100,
      deposit: 20,
      blockedDates: '[]',
      title: 'Test Listing',
    });
    prisma.booking.create.mockResolvedValue({
      id: 'booking-1',
      listingId: 'listing-1',
      renterId: 'user-1',
      status: 'PENDING',
      totalAmount: 220,
      serviceFee: 20,
      listing: { title: 'Test Listing' },
    });
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      listingId: 'listing-1',
      renterId: 'user-1',
      status: 'PENDING',
      listing: { ownerId: 'owner-1', title: 'Test Listing' },
      totalAmount: 220,
      serviceFee: 20,
    });
    prisma.booking.update.mockResolvedValue({ id: 'booking-1', status: 'CONFIRMED' });

    const createRes = await request(app)
      .post('/api/bookings')
      .send({ listingId: 'listing-1', startDate: '2026-08-01', endDate: '2026-08-03' })
      .expect(200);

    expect(createRes.body.id).toBe('booking-1');

    const confirmRes = await request(app)
      .patch('/api/bookings/booking-1/status')
      .set('x-user-id', 'owner-1')
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(confirmRes.body.status).toBe('CONFIRMED');
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: expect.objectContaining({ status: 'CONFIRMED' }),
    });
  });
});
