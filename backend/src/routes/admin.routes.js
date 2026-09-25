const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { z } = require('zod');
const {
  STATUS,
  rejectUpiPayment,
  settlePayment,
} = require('../services/payment.service');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

router.use(requireAuth, requireAdmin);

router.get('/stats', async (_req, res, next) => {
  try {
    const [users, listings, bookings, paid] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    ]);
    res.json({ users, listings, bookings, revenue: paid._sum.amount || 0 });
  } catch (e) { next(e); }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, phone: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.patch('/users/:id/role', validateId, async (req, res, next) => {
  try {
    // SECURITY: Prevent admins from demoting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot change their own role' });
    }
    const { role } = z.object({ role: z.enum(['USER', 'ADMIN']) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, phone: true, name: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (e) { next(e); }
});

/**
 * UPI payments renters say they've paid, newest first.
 * `status=ALL` includes settled/rejected rows for the history view.
 */
router.get('/payments', async (req, res, next) => {
  try {
    const status = String(req.query.status || STATUS.AWAITING_VERIFICATION).toUpperCase();
    const where = status === 'ALL'
      ? { method: 'UPI_QR' }
      : { method: 'UPI_QR', status };

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        booking: {
          include: {
            listing: { select: { id: true, title: true, city: true, ownerId: true } },
            renter: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    res.json(payments.map((payment) => ({
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      ref: payment.upiRef,
      payeeVpa: payment.upiPayeeVpa,
      utr: payment.payerUtr,
      note: payment.payerNote,
      proofUrl: payment.proofUrl,
      rejectionReason: payment.rejectionReason,
      createdAt: payment.createdAt,
      verifiedAt: payment.verifiedAt,
      bookingId: payment.bookingId,
      bookingStatus: payment.booking?.status || null,
      listingTitle: payment.booking?.listing?.title || null,
      listingCity: payment.booking?.listing?.city || null,
      renterName: payment.booking?.renter?.name || null,
      renterEmail: payment.booking?.renter?.email || null,
      renterPhone: payment.booking?.renter?.phone || null,
    })));
  } catch (e) { next(e); }
});

/**
 * Confirm the money actually landed in the bank/UPI account.
 * This is the step that flips the booking to CONFIRMED — check your bank or
 * UPI app for a credit of `amount` with `utr`/`ref` before clicking.
 */
router.post('/payments/:id/verify', validateId, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.method !== 'UPI_QR') {
      return res.status(409).json({ error: 'Only UPI QR payments are verified by hand' });
    }

    const result = await settlePayment({
      paymentId: payment.id,
      verifiedById: req.user.id,
      io: req.app.get('io'),
    });

    if (!result.ok) {
      return res.status(result.reason === 'payment_not_found' ? 404 : 400)
        .json({ error: 'Could not verify this payment' });
    }

    res.json({ ok: true, bookingId: result.bookingId, alreadyProcessed: result.alreadyProcessed });
  } catch (e) { next(e); }
});

router.post('/payments/:id/reject', validateId, async (req, res, next) => {
  try {
    const { reason } = z.object({
      reason: z.string().trim().max(300).optional().default(''),
    }).parse(req.body || {});

    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === STATUS.PAID) {
      return res.status(409).json({ error: 'This payment is already marked as paid' });
    }

    await rejectUpiPayment({ paymentId: payment.id, reason, verifiedById: req.user.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/listings/:id', validateId, async (req, res, next) => {
  try {
    // SECURITY: Prevent deletion of listings with active bookings
    const activeBooking = await prisma.booking.findFirst({
      where: {
        listingId: req.params.id,
        status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP'] }
      },
      select: { id: true }
    });
    if (activeBooking) {
      return res.status(409).json({ error: 'Cannot delete listing with active bookings. Cancel or complete them first.' });
    }
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
