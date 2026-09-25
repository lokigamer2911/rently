const express = require('express');
const request = require('supertest');

// The UPI config module caches payees on first read, like it does in production
// where env vars are fixed at boot — so configure them before requiring routes.
process.env.UPI_PAYEES = JSON.stringify([
  { vpa: 'founder@okhdfcbank', name: 'Rently', label: 'Founder' },
  { vpa: 'cofounder@ybl', name: 'Rently', label: 'Co-founder' },
]);
process.env.PAYMENTS_RAZORPAY_ENABLED = 'false';

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
const { createNotification } = require('../src/utils/notifications');
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
  it('announces the in-progress gateway and the UPI fallback', async () => {
    const res = await request(app).get('/api/payments/config').expect(200);

    expect(res.body.razorpayEnabled).toBe(false);
    expect(res.body.upiQrEnabled).toBe(true);
    expect(res.body.method).toBe('UPI_QR');
    expect(res.body.notice).toMatch(/razorpay integration is in progress/i);
    expect(res.body.payeeCount).toBe(2);
  });
});

describe('POST /payments/upi/intent', () => {
  const mockBooking = {
    id: BOOKING_ID,
    renterId: RENTER_ID,
    totalAmount: 129900,
    status: 'PENDING',
    listing: { title: 'Sony A7 III' },
  };

  it('returns a UPI deep link carrying the exact amount and a reference', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(mockBooking);
    prisma.payment.findUnique.mockResolvedValueOnce(null);
    prisma.payment.upsert.mockImplementationOnce(async ({ create }) => ({
      id: PAYMENT_ID, status: 'CREATED', ...create,
    }));

    const res = await request(app)
      .post('/api/payments/upi/intent')
      .send({ bookingId: BOOKING_ID })
      .expect(200);

    expect(res.body.amount).toBe(129900);
    expect(res.body.amountRupees).toBe('1299.00');
    expect(res.body.ref).toMatch(/^RTX[A-Z2-9]{6}$/);
    expect(res.body.payee.vpa).toMatch(/@/);
    expect(res.body.upiLink).toContain('am=1299.00');
    expect(res.body.upiLink).toContain(`tr=${res.body.ref}`);
    expect(res.body.upiLink.startsWith('upi://pay?')).toBe(true);
  });

  it('keeps the same payee and reference when reopened', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(mockBooking);
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID, status: 'CREATED', upiRef: 'RTXKEEP01', upiPayeeVpa: 'cofounder@ybl',
    });
    prisma.payment.upsert.mockImplementationOnce(async ({ update }) => ({
      id: PAYMENT_ID, status: 'CREATED', upiRef: 'RTXKEEP01', ...update,
    }));

    const res = await request(app)
      .post('/api/payments/upi/intent')
      .send({ bookingId: BOOKING_ID })
      .expect(200);

    expect(res.body.ref).toBe('RTXKEEP01');
    expect(res.body.payee.vpa).toBe('cofounder@ybl');
  });

  it("refuses to build an intent for someone else's booking", async () => {
    prisma.booking.findUnique.mockResolvedValueOnce({ ...mockBooking, renterId: 'someone-else' });

    await request(app)
      .post('/api/payments/upi/intent')
      .send({ bookingId: BOOKING_ID })
      .expect(403);
  });

  it('returns 404 for an unknown booking', async () => {
    prisma.booking.findUnique.mockResolvedValueOnce(null);
    await request(app).post('/api/payments/upi/intent').send({ bookingId: BOOKING_ID }).expect(404);
  });
});

describe('POST /payments/upi/claim', () => {
  const claimBody = { paymentId: PAYMENT_ID, utr: '402312345678' };

  it('parks the payment in AWAITING_VERIFICATION and alerts the admins', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce({ id: PAYMENT_ID, bookingId: BOOKING_ID, status: 'CREATED', upiRef: 'RTXABC123' })
      .mockResolvedValueOnce({
        id: PAYMENT_ID,
        upiRef: 'RTXABC123',
        status: 'CREATED',
        booking: {
          renter: { name: 'Asha' },
          listing: { title: 'Sony A7 III' },
        },
      });
    prisma.booking.findUnique.mockResolvedValueOnce({ id: BOOKING_ID, renterId: RENTER_ID });
    prisma.payment.update.mockResolvedValueOnce({});
    prisma.user.findMany.mockResolvedValueOnce([{ id: ADMIN_ID }]);

    const res = await request(app).post('/api/payments/upi/claim').send(claimBody).expect(200);

    expect(res.body.status).toBe('AWAITING_VERIFICATION');
    expect(res.body.alreadyPaid).toBe(false);
    expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'AWAITING_VERIFICATION', payerUtr: '402312345678' }),
    }));
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification.mock.calls[0][1].link).toBe('/admin?tab=payments');
  });

  it('does not confirm the booking — only the UTR is recorded', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce({ id: PAYMENT_ID, bookingId: BOOKING_ID, status: 'CREATED' })
      .mockResolvedValueOnce({ id: PAYMENT_ID, status: 'CREATED', booking: {} });
    prisma.booking.findUnique.mockResolvedValueOnce({ id: BOOKING_ID, renterId: RENTER_ID });
    prisma.payment.update.mockResolvedValueOnce({});
    prisma.user.findMany.mockResolvedValueOnce([]);

    await request(app).post('/api/payments/upi/claim').send(claimBody).expect(200);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('rejects a UTR that is too short to be real', async () => {
    await request(app)
      .post('/api/payments/upi/claim')
      .send({ paymentId: PAYMENT_ID, utr: '123' })
      .expect(400);
  });

  it('is idempotent once the payment is already paid', async () => {
    prisma.payment.findUnique
      .mockResolvedValueOnce({ id: PAYMENT_ID, bookingId: BOOKING_ID, status: 'PAID' })
      .mockResolvedValueOnce({ id: PAYMENT_ID, status: 'PAID' });
    prisma.booking.findUnique.mockResolvedValueOnce({ id: BOOKING_ID, renterId: RENTER_ID });

    const res = await request(app).post('/api/payments/upi/claim').send(claimBody).expect(200);

    expect(res.body.alreadyPaid).toBe(true);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});

describe('GET /payments/upi/:paymentId', () => {
  it('lets the renter poll their own payment status', async () => {
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID,
      status: 'AWAITING_VERIFICATION',
      upiRef: 'RTXABC123',
      amount: 129900,
      method: 'UPI_QR',
      booking: { id: BOOKING_ID, status: 'PENDING', renterId: RENTER_ID, totalAmount: 129900 },
    });

    const res = await request(app).get(`/api/payments/upi/${PAYMENT_ID}`).expect(200);
    expect(res.body.status).toBe('AWAITING_VERIFICATION');
  });

  it("hides another renter's payment", async () => {
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID,
      status: 'PAID',
      booking: { id: BOOKING_ID, status: 'CONFIRMED', renterId: 'someone-else' },
    });

    await request(app).get(`/api/payments/upi/${PAYMENT_ID}`).expect(403);
  });
});

describe('Admin payment verification', () => {
  it('confirms the booking once the credit is verified', async () => {
    asAdmin();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID, method: 'UPI_QR', status: 'AWAITING_VERIFICATION', bookingId: BOOKING_ID,
    });
    prisma.payment.findFirst.mockResolvedValueOnce({
      id: PAYMENT_ID, method: 'UPI_QR', status: 'AWAITING_VERIFICATION', bookingId: BOOKING_ID,
    });
    prisma.booking.findUnique.mockResolvedValueOnce({
      id: BOOKING_ID,
      listingId: LISTING_ID,
      renterId: RENTER_ID,
      listing: { id: LISTING_ID, ownerId: 'owner-1', title: 'Sony A7 III' },
    });

    const res = await request(app).post(`/api/admin/payments/${PAYMENT_ID}/verify`).expect(200);

    expect(res.body.ok).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Both the renter and the host get told.
    expect(createNotification).toHaveBeenCalledTimes(2);
  });

  it('refuses to hand-verify a Razorpay payment', async () => {
    asAdmin();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID, method: 'RAZORPAY', status: 'CREATED', bookingId: BOOKING_ID,
    });

    await request(app).post(`/api/admin/payments/${PAYMENT_ID}/verify`).expect(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('records a rejection with a reason', async () => {
    asAdmin();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID, method: 'UPI_QR', status: 'AWAITING_VERIFICATION',
    });
    prisma.payment.update.mockResolvedValueOnce({});

    const res = await request(app)
      .post(`/api/admin/payments/${PAYMENT_ID}/reject`)
      .send({ reason: 'No matching credit' })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REJECTED', rejectionReason: 'No matching credit' }),
    }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('will not reject a payment that is already settled', async () => {
    asAdmin();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: PAYMENT_ID, method: 'UPI_QR', status: 'PAID',
    });

    await request(app)
      .post(`/api/admin/payments/${PAYMENT_ID}/reject`)
      .send({ reason: 'oops' })
      .expect(409);
  });

  it('is closed to non-admins', async () => {
    asRenter();
    await request(app).get('/api/admin/payments?status=ALL').expect(403);
    await request(app).post(`/api/admin/payments/${PAYMENT_ID}/verify`).expect(403);
  });

  it('lists UPI payments for review', async () => {
    asAdmin();
    prisma.payment.findMany.mockResolvedValueOnce([{
      id: PAYMENT_ID,
      status: 'AWAITING_VERIFICATION',
      method: 'UPI_QR',
      amount: 129900,
      upiRef: 'RTXABC123',
      upiPayeeVpa: 'founder@okhdfcbank',
      payerUtr: '402312345678',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      bookingId: BOOKING_ID,
      booking: {
        status: 'PENDING',
        listing: { id: LISTING_ID, title: 'Sony A7 III', city: 'Chennai', ownerId: 'owner-1' },
        renter: { id: RENTER_ID, name: 'Asha', email: 'asha@example.com', phone: '9999999999' },
      },
    }]);

    const res = await request(app).get('/api/admin/payments?status=ALL').expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      utr: '402312345678',
      ref: 'RTXABC123',
      listingTitle: 'Sony A7 III',
      renterName: 'Asha',
    });
  });
});
