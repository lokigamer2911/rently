const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../config/prisma');
const razorpay = require('../config/razorpay');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');
const { createNotification } = require('../utils/notifications');
const logger = require('../utils/logger');

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

const notifyBookingConfirmation = async (booking, io) => {
  if (!booking) return;

  await createNotification(io, {
    userId: booking.renterId,
    type: 'BOOKING_UPDATE',
    title: 'Payment confirmed ✅',
    body: `Your booking for ${booking.listing.title} is now confirmed.`,
    link: '/bookings',
  });

  await createNotification(io, {
    userId: booking.listing.ownerId,
    type: 'BOOKING_UPDATE',
    title: 'Booking confirmed ✅',
    body: `A booking for ${booking.listing.title} has been confirmed and paid.`,
    link: '/bookings',
  });
};

const confirmBooking = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, io }) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
    if (!payment) return { ok: false, reason: 'payment_not_found' };
    if (payment.status === 'PAID') {
      return { ok: true, alreadyProcessed: true, bookingId: payment.bookingId };
    }

    const booking = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { razorpayOrderId },
        data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      await tx.listing.update({
        where: { id: updatedBooking.listingId },
        data: { available: false },
      });

      return updatedBooking;
    });

    const hydratedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { listing: true, renter: true },
    });

    await notifyBookingConfirmation(hydratedBooking, io);

    return { ok: true, alreadyProcessed: false, bookingId: booking.id };
  } catch (error) {
    console.warn('Payment confirmation skipped due to Prisma error:', error.message);
    return { ok: true, alreadyProcessed: true, bookingId: null };
  }
};

// Create Razorpay order for a booking
router.post('/order', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = z.object({ bookingId: z.string() }).parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.renterId !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    const order = await razorpay.orders.create({
      amount: booking.totalAmount,
      currency: 'INR',
      receipt: booking.id,
      notes: { bookingId: booking.id },
    });

    await prisma.payment.upsert({
      where: { bookingId },
      update: { razorpayOrderId: order.id, amount: booking.totalAmount, status: 'CREATED' },
      create: { bookingId, razorpayOrderId: order.id, amount: booking.totalAmount },
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
          status: 'CREATED',
        },
      });
    } else if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const confirmationKey = getConfirmationKey(razorpay_order_id, razorpay_payment_id);
    if (tryMarkProcessed(confirmationKey)) {
      return res.json({ ok: true, message: 'already processed' });
    }

    const confirmation = await confirmBooking({
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

      const confirmation = await confirmBooking({
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
        where: { razorpayOrderId: orderId, status: { not: 'PAID' } },
        data: { status: 'FAILED' },
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send('err');
  }
});

module.exports = router;
