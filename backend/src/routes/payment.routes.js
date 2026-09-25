const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../config/prisma');
const razorpay = require('../config/razorpay');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');
const logger = require('../utils/logger');
const qr = require('../utils/qr');
const upi = require('../config/upi');
const {
  METHOD,
  STATUS,
  settlePayment,
  submitUpiClaim,
} = require('../services/payment.service');

const createSignature = (payload, secret) => {
  const normalizedPayload = Buffer.isBuffer(payload) ? payload : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return crypto.createHmac('sha256', secret).update(normalizedPayload).digest('hex');
};

const processedConfirmationKeys = new Map();

const getConfirmationKey = (orderId, paymentId) => `${orderId}:${paymentId}`;

/** Check and atomically mark a confirmation key as processed */
function tryMarkProcessed(key) {
  if (processedConfirmationKeys.has(key)) return true;
  processedConfirmationKeys.set(key, Date.now());
  return false;
}

// Periodically clean up old keys (prevent unbounded memory growth)
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  for (const [key, timestamp] of processedConfirmationKeys) {
    if (timestamp < cutoff) processedConfirmationKeys.delete(key);
  }
}, 60 * 60 * 1000); // Run hourly

const normalizeWebhookEvent = (event) => {
  if (!event || typeof event !== 'object') return null;

  if (event.event) return event;

  if (event.order_id || event.payment_id || event.id) {
    const entity = {
      order_id: event.order_id || event.id,
      id: event.payment_id || event.id,
    };

    return {
      event: event.status === 'captured' ? 'payment.captured' : 'order.paid',
      payload: {
        payment: { entity },
        order: { entity },
      },
    };
  }

  return null;
};

/**
 * Which payment method checkout should use right now.
 * This is what drives the "Razorpay integration is in progress" notice.
 */
router.get('/config', (_req, res) => {
  const razorpayEnabled = upi.isRazorpayEnabled();
  const upiEnabled = upi.isUpiQrEnabled();

  res.json({
    method: razorpayEnabled ? METHOD.RAZORPAY : METHOD.UPI_QR,
    razorpayEnabled,
    upiQrEnabled: upiEnabled,
    notice: razorpayEnabled ? null : upi.RAZORPAY_PENDING_NOTICE,
    supportContact: upi.getSupportContact(),
    payeeCount: upi.getPayees().length,
  });
});

/**
 * Build (or re-fetch) the UPI payment intent for a booking.
 *
 * Nothing is charged here — we hand back a deep link and a QR encoding the
 * exact amount plus a unique reference, then wait for a human to confirm the
 * credit landed. See POST /upi/claim.
 */
router.post('/upi/intent', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = z.object({ bookingId: z.string().min(1) }).parse(req.body);

    if (!upi.isUpiQrEnabled()) {
      return res.status(503).json({
        error: 'UPI payments are not configured yet. Please contact support.',
        code: 'UPI_NOT_CONFIGURED',
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { title: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const existing = await prisma.payment.findUnique({ where: { bookingId } });
    if (existing?.status === STATUS.PAID) {
      return res.json({ alreadyPaid: true, status: STATUS.PAID, bookingId });
    }

    const ref = existing?.upiRef || upi.generateRef();
    const payees = upi.getPayees();
    // Keep the UPI ID stable across re-opens; fall back to a fresh pick if the
    // stored VPA was removed from the config.
    const payee = payees.find((p) => p.vpa === existing?.upiPayeeVpa) || upi.pickPayee(ref);
    if (!payee) {
      return res.status(503).json({ error: 'No UPI payee configured', code: 'UPI_NOT_CONFIGURED' });
    }

    const payment = await prisma.payment.upsert({
      where: { bookingId },
      update: {
        method: METHOD.UPI_QR,
        amount: booking.totalAmount,
        upiRef: ref,
        upiPayeeVpa: payee.vpa,
        upiPayeeName: payee.name,
      },
      create: {
        bookingId,
        method: METHOD.UPI_QR,
        amount: booking.totalAmount,
        upiRef: ref,
        upiPayeeVpa: payee.vpa,
        upiPayeeName: payee.name,
        status: STATUS.CREATED,
      },
    });

    const upiLink = upi.buildUpiLink({
      payee,
      amountPaise: booking.totalAmount,
      ref,
      note: `Rently rent ${ref}`,
    });

    res.json({
      paymentId: payment.id,
      bookingId,
      status: payment.status,
      ref,
      amount: booking.totalAmount,
      amountRupees: upi.toRupees(booking.totalAmount),
      currency: 'INR',
      payee: { vpa: payee.vpa, name: payee.name, label: payee.label || null },
      upiLink,
      qrDataUrl: await qr.toDataUrl(upiLink),
      staticQrUrl: upi.getStaticQrUrl(),
      listingTitle: booking.listing?.title || null,
      supportContact: upi.getSupportContact(),
      notice: upi.RAZORPAY_PENDING_NOTICE,
    });
  } catch (e) { next(e); }
});

/**
 * Renter says "I've paid" and pastes the UTR/RRN from their UPI app.
 * This does NOT confirm the booking — an admin still matches it against the
 * bank credit in /admin → Payments.
 */
router.post('/upi/claim', requireAuth, async (req, res, next) => {
  try {
    const payload = z.object({
      paymentId: z.string().min(1),
      utr: z.string().trim().min(6).max(64),
      note: z.string().trim().max(500).optional().default(''),
      proofUrl: z.string().url().max(500).optional().or(z.literal('')).default(''),
    }).parse(req.body);

    const payment = await prisma.payment.findUnique({ where: { id: payload.paymentId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
    if (!booking || (booking.renterId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await submitUpiClaim({
      paymentId: payment.id,
      utr: payload.utr,
      note: payload.note,
      proofUrl: payload.proofUrl,
      io: req.app.get('io'),
    });

    if (!result.ok) {
      const status = result.reason === 'payment_not_found' ? 404 : 409;
      return res.status(status).json({
        error: result.reason === 'rejected'
          ? 'This payment was rejected. Please contact support.'
          : 'Could not record this payment reference.',
      });
    }

    res.json({
      ok: true,
      alreadyPaid: Boolean(result.alreadyPaid),
      status: result.alreadyPaid ? STATUS.PAID : STATUS.AWAITING_VERIFICATION,
    });
  } catch (e) { next(e); }
});

/**
 * Status poll for the checkout modal, so the renter's screen flips to
 * "confirmed" the moment an admin verifies the credit.
 */
router.get('/upi/:paymentId', requireAuth, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: { booking: { select: { id: true, status: true, renterId: true, totalAmount: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const isOwner = payment.booking?.renterId === req.user.id;
    if (!isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    res.json({
      paymentId: payment.id,
      status: payment.status,
      ref: payment.upiRef,
      amount: payment.amount,
      method: payment.method,
      utr: payment.payerUtr || null,
      payeeVpa: payment.upiPayeeVpa || null,
      rejectionReason: payment.rejectionReason || null,
      bookingStatus: payment.booking?.status || null,
      verifiedAt: payment.verifiedAt,
    });
  } catch (e) { next(e); }
});

// Create Razorpay order for a booking — only meaningful once the gateway is live
router.post('/order', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = z.object({ bookingId: z.string() }).parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.renterId !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    if (!upi.isRazorpayEnabled()) {
      return res.status(503).json({
        error: upi.RAZORPAY_PENDING_NOTICE,
        code: 'RAZORPAY_PENDING',
      });
    }

    const order = await razorpay.orders.create({
      amount: booking.totalAmount,
      currency: 'INR',
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });

    await prisma.payment.upsert({
      where: { bookingId },
      update: {
        razorpayOrderId: order.id,
        amount: booking.totalAmount,
        status: STATUS.CREATED,
        method: METHOD.RAZORPAY,
      },
      create: {
        bookingId,
        razorpayOrderId: order.id,
        amount: booking.totalAmount,
        method: METHOD.RAZORPAY,
      },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) { next(e); }
});

// Verify payment signature after Razorpay checkout success
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).parse(req.body);

    const expected = createSignature(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid signature' });

    let bookingId = null;
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      bookingId = order?.notes?.bookingId || order?.receipt || null;
    } catch (error) {
      console.warn('Unable to fetch Razorpay order for verification:', error.message);
    }

    const existingPayment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
    if (!existingPayment && bookingId) {
      await prisma.payment.create({
        data: {
          bookingId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          amount: 0,
          status: STATUS.CREATED,
          method: METHOD.RAZORPAY,
        },
      });
    } else if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // A real payment id ending in a signature match already proves the money
    // moved, so this settles directly (unlike the UPI path, which needs a human).
    const confirmationKey = getConfirmationKey(razorpay_order_id, razorpay_payment_id);
    if (tryMarkProcessed(confirmationKey)) {
      return res.json({ ok: true, message: 'already processed' });
    }

    const confirmation = await settlePayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      io: req.app.get('io'),
    });

    if (confirmation.alreadyProcessed || confirmation.reason === 'payment_not_found') {
      return res.json({ ok: true, message: 'already processed' });
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Razorpay webhook (raw body — see index.js)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : null);
    const bodyText = rawBody
      ? rawBody.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});
    const bodyBuffer = rawBody || Buffer.from(bodyText, 'utf8');
    const expected = createSignature(bodyBuffer, process.env.RAZORPAY_WEBHOOK_SECRET);

    if (signature !== expected) {
      // SECURITY: Never log the expected HMAC — it reveals the webhook secret's output
      logger.warn('Webhook signature mismatch', { hasSignature: !!signature });
      return res.status(400).send('bad signature');
    }

    const event = normalizeWebhookEvent(JSON.parse(bodyText));

    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payload = event.event === 'payment.captured' ? event.payload.payment.entity : event.payload.order.entity;
      const orderId = payload.order_id || payload.id;
      const confirmationKey = getConfirmationKey(orderId, payload.id);
      if (tryMarkProcessed(confirmationKey)) {
        return res.json({ ok: true, message: 'already processed' });
      }

      const confirmation = await settlePayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: payload.id,
        razorpaySignature: 'webhook',
        io: req.app.get('io'),
      });

      if (confirmation.alreadyProcessed || confirmation.reason === 'payment_not_found') {
        return res.json({ ok: true, message: 'already processed' });
      }
    } else if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId, status: { not: STATUS.PAID } },
        data: { status: STATUS.FAILED },
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send('err');
  }
});

module.exports = router;
