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
    const userId = req.headers['x-user-id'] || 'clxrenter00000000000001';
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
      id: 'clxlisting0000000000001',
      available: true,
      ownerId: 'clxowner000000000000001',
      pricePerDay: 100,
      deposit: 20,
      blockedDates: '[]',
      title: 'Test Listing',
    });
    prisma.booking.create.mockResolvedValue({
      id: 'clxbooking0000000000001',
      listingId: 'clxlisting0000000000001',
      renterId: 'clxrenter00000000000001',
      status: 'PENDING',
      totalAmount: 220,
      serviceFee: 20,
      listing: { title: 'Test Listing' },
    });
    prisma.booking.findUnique.mockResolvedValue({
      id: 'clxbooking0000000000001',
      listingId: 'clxlisting0000000000001',
      renterId: 'clxrenter00000000000001',
      status: 'PENDING',
      listing: { ownerId: 'clxowner000000000000001', title: 'Test Listing' },
      totalAmount: 220,
      serviceFee: 20,
    });
    prisma.booking.update.mockResolvedValue({ id: 'clxbooking0000000000001', status: 'CONFIRMED' });

    const createRes = await request(app)
      .post('/api/bookings')
      .send({ listingId: 'clxlisting0000000000001', startDate: '2026-08-01', endDate: '2026-08-03' })
      .expect(200);

    expect(createRes.body.id).toBe('clxbooking0000000000001');

    const confirmRes = await request(app)
      .patch('/api/bookings/clxbooking0000000000001/status')
      .set('x-user-id', 'clxowner000000000000001')
      .send({ status: 'CONFIRMED' })
      .expect(200);

    expect(confirmRes.body.status).toBe('CONFIRMED');
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'clxbooking0000000000001' },
      data: expect.objectContaining({ status: 'CONFIRMED' }),
    });
  });
});
