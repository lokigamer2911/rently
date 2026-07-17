const express = require('express');
const request = require('supertest');

jest.mock('../src/config/prisma', () => ({
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  dispute: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
}));

const prisma = require('../src/config/prisma');
const disputeRoutes = require('../src/routes/dispute.routes');

const app = express();
app.use(express.json());
app.use('/api/disputes', disputeRoutes);

describe('Dispute routes validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects dispute creation with an invalid reason', async () => {
    prisma.booking.findUnique.mockResolvedValue({ id: 'booking-1', renterId: 'user-1', listing: { ownerId: 'owner-1' } });

    const res = await request(app)
      .post('/api/disputes/booking-1')
      .send({ reason: 'bad' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(prisma.dispute.create).not.toHaveBeenCalled();
  });

  it('rejects invalid resolution actions on dispute resolve', async () => {
    prisma.dispute.update.mockResolvedValue({ id: 'dispute-1', bookingId: 'booking-1', status: 'RESOLVED' });

    const res = await request(app)
      .post('/api/disputes/dispute-1/resolve')
      .send({ resolutionAction: 'HACKED' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});
