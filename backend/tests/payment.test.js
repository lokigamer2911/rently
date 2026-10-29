const express = require('express');
const request = require('supertest');

// Razorpay-only checkout — no UPI fallback. Configure gateway keys before
// requiring routes (same as production, where env vars are fixed at boot).
process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_123';

// Ids must satisfy the admin router's cuid-ish validator: [a-z0-9]{20,}
const PAYMENT_ID = 'clxpayment0000000000001';
const BOOKING_ID = 'clxbooking0000000000001';
const LISTING_ID = 'clxlisting0000000000001';
const RENTER_ID = 'clxrenter00000000000001';
const ADMIN_ID = 'clxadmin000000000000001';

jest.mock('../src/config/prisma', () => ({
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  booking: {
    update: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  listing: {
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(async (callback) => {
    const tx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      booking: { update: jest.fn().mockResolvedValue({ id: BOOKING_ID, listingId: LISTING_ID }) },
      listing: { update: jest.fn().mockResolvedValue({}) },
    };
    return callback(tx);
  }),
}));

jest.mock('../src/config/razorpay', () => ({ orders: { create: jest.fn(), fetch: jest.fn() } }));
jest.mock('../src/utils/notifications', () => ({ createNotification: jest.fn().mockResolvedValue({}) }));

// Swap out real JWT auth so the handlers can be exercised directly.
const mockAuth = { user: { id: RENTER_ID, role: 'USER' } };
jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, _res, next) => { req.user = mockAuth.user; next(); },
  requireAdmin: (req, res, next) => {
    req.user = mockAuth.user;
    if (mockAuth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    return next();
  },
}));

const prisma = require('../src/config/prisma');
const razorpay = require('../src/config/razorpay');
const { createNotification } = require('../src/utils/notifications');

// Admin routes now also require the platform admin key. Configure a test hash
// and send the matching header on every admin request below.
const ADMIN_KEY = 'rnt_test_admin_key';
process.env.ADMIN_KEY_HASH = require('crypto')
  .createHash('sha256').update(ADMIN_KEY, 'utf8').digest('hex');
const adminKeyHeader = { 'X-Admin-Key': ADMIN_KEY };

const paymentRoutes = require('../src/routes/payment.routes');
const adminRoutes = require('../src/routes/admin.routes');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const asRenter = () => { mockAuth.user = { id: RENTER_ID, role: 'USER' }; };
const asAdmin = () => { mockAuth.user = { id: ADMIN_ID, role: 'ADMIN' }; };

beforeEach(() => {
  jest.clearAllMocks();
  asRenter();
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_123';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_123';
});

describe('Payment webhook idempotency', () => {
  it('should handle the same webhook twice without duplicate side-effects', async () => {
    const payload = { order_id: 'ord_123', payment_id: 'pay_456', status: 'captured' };
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    prisma.payment.findFirst.mockResolvedValueOnce({
      id: PAYMENT_ID,
      razorpayOrderId: 'ord_123',
      razorpayPaymentId: null,
      status: 'CREATED',
      bookingId: BOOKING_ID,
    });
    prisma.booking.findUnique.mockResolvedValueOnce({
      id: BOOKING_ID,
      listingId: LISTING_ID,
      renterId: RENTER_ID,
      status: 'PENDING',
      listing: { id: LISTING_ID, ownerId: 'owner-1', title: 'Test Listing' },
      totalAmount: 100,
      serviceFee: 5,
    });

    const first = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(first.body.ok).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledTimes(2);

    const second = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(second.body.message).toMatch(/already processed/i);
    // The duplicate must not confirm the booking or notify anyone a second time.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledTimes(2);
  });

  it('rejects a webhook with a bad signature', async () => {
    await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', 'nope')
      .send({ order_id: 'ord_1', payment_id: 'pay_1', status: 'captured' })
      .expect(400);
  });
});

describe('GET /payments/config', () => {
  it('announces the Razorpay-only checkout', async () => {
    const res = await request(app).get('/api/payments/config').expect(200);

    expect(res.body.razorpayEnabled).toBe(true);
    expect(res.body.upiQrEnabled).toBe(false);
    expect(res.body.method).toBe('RAZORPAY');
  });

  it('reports missing keys when Razorpay is not configured', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    const res = await request(app).get('/api/payments/config').expect(200);

    expect(res.body.razorpayEnabled).toBe(false);
    expect(res.body.notice).toMatch(/not configured/i);
  });
});

describe('POST /payments/order', () => {
  const mockBooking = {
    id: BOOKING_ID,
    renterId: RENTER_ID,
    totalAmount: 129900,
    status: 'PENDING',
  };

  it('creates a Razorpay order for the renter', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(mockBooking);
    razorpay.orders.create.mockResolvedValueOnce({
      id: 'order_test123', amount: 129900, currency: 'INR',
    });
    prisma.payment.upsert.mockResolvedValueOnce({ id: PAYMENT_ID });

    const res = await request(app)
      .post('/api/payments/order')
      .send({ bookingId: BOOKING_ID })
      .expect(200);

    expect(res.body.orderId).toBe('order_test123');
    expect(res.body.key).toBe('rzp_test_123');
    expect(prisma.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { bookingId: BOOKING_ID },
    }));
  });

  it("refuses to build an order for someone else's booking", async () => {
    prisma.booking.findUnique.mockResolvedValueOnce({ ...mockBooking, renterId: 'someone-else' });

    await request(app)
      .post('/api/payments/order')
      .send({ bookingId: BOOKING_ID })
      .expect(403);
  });

  it('returns 503 when Razorpay keys are missing', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    prisma.booking.findUnique.mockResolvedValueOnce(mockBooking);

    const res = await request(app)
      .post('/api/payments/order')
      .send({ bookingId: BOOKING_ID })
      .expect(503);

    expect(res.body.code).toBe('RAZORPAY_NOT_CONFIGURED');
  });
});

describe('Admin routes (non-payment)', () => {
  it('is closed to non-admins (even with a valid admin key)', async () => {
    asRenter();
    await request(app).get('/api/admin/stats').set(adminKeyHeader).expect(403);
    await request(app).get('/api/admin/users').set(adminKeyHeader).expect(403);
  });

  it('is closed to admins without the admin key', async () => {
    asAdmin();
    await request(app).get('/api/admin/stats').expect(401);
    await request(app).get('/api/admin/users').expect(401);
  });
});
