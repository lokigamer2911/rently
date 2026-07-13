const router = require('express').Router();
const crypto = require('crypto');
const prisma = require('../config/prisma');
const razorpay = require('../config/razorpay');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

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

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid signature' });

    const payment = await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'PAID' },
    });
    const booking = await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } });
    await prisma.listing.update({ where: { id: booking.listingId }, data: { available: false } });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Razorpay webhook (raw body — see index.js)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // raw Buffer
      .digest('hex');

    if (signature !== expected) return res.status(400).send('bad signature');

    const event = JSON.parse(req.body.toString());
    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { status: 'FAILED' },
      }).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send('err');
  }
});

module.exports = router;
