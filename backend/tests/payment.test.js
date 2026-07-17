const express = require('express');
const request = require('supertest');

jest.mock('../src/config/prisma', () => ({
  payment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  listing: {
    update: jest.fn(),
  },
  $transaction: jest.fn(async (callback) => {
    const tx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      booking: { update: jest.fn().mockResolvedValue({ id: 'booking-1', listingId: 'listing-1' }) },
      listing: { update: jest.fn().mockResolvedValue({}) },
    };
    return callback(tx);
  }),
}));

jest.mock('../src/config/razorpay', () => ({ orders: { create: jest.fn(), fetch: jest.fn() } }));
jest.mock('../src/utils/notifications', () => ({ createNotification: jest.fn() }));

const prisma = require('../src/config/prisma');
const paymentRoutes = require('../src/routes/payment.routes');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('Payment webhook idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_123';
  });

  it('should handle the same webhook twice without duplicate side-effects', async () => {
    const payload = { order_id: 'ord_123', payment_id: 'pay_456', status: 'captured' };
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    prisma.payment.findUnique.mockResolvedValueOnce({
      id: 'payment-1',
      razorpayOrderId: 'ord_123',
      razorpayPaymentId: null,
      status: 'CREATED',
      bookingId: 'booking-1',
    });
    prisma.booking.findUnique.mockResolvedValueOnce({
      id: 'booking-1',
      listingId: 'listing-1',
      renterId: 'user-1',
      status: 'PENDING',
      listing: { id: 'listing-1', ownerId: 'owner-1', title: 'Test Listing' },
      totalAmount: 100,
      serviceFee: 5,
    });

    const first = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(first.body.ok).toBe(true);

    const second = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(second.body.message).toMatch(/already processed/i);
  });
});
