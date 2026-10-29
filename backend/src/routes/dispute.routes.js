const express = require('express');
const { z, ZodError } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');
const { sendDisputeNotificationEmail } = require('../utils/email');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

const VALID_RESOLUTION_ACTIONS = ['CANCELLED', 'COMPLETED'];

const resolveDisputeSchema = z.object({
  resolutionAction: z.enum(VALID_RESOLUTION_ACTIONS).optional(),
});

const createDisputeSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

const routeErrorHandler = (error, res) => {
  if (error instanceof ZodError) {
    // Zod 4 renamed .errors to .issues; return a readable string, not raw issue objects
    return res.status(400).json({ error: error.issues.map(i => i.message).join(', ') });
  }
  return res.status(500).json({ error: 'Failed to process request' });
};

const router = express.Router();

// Create a new dispute for a booking
router.post('/:bookingId', requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!CUID_RE.test(bookingId)) return res.status(400).json({ error: 'Invalid ID format' });
    const { reason } = createDisputeSchema.parse(req.body);

    // Verify booking exists and user is part of it
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.renterId !== req.user.id && booking.listing.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to dispute this booking' });
    }

    // SECURITY: Only allow disputes on active bookings
    if (!['CONFIRMED', 'PICKED_UP'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot dispute a booking with status ${booking.status}` });
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        userId: req.user.id,
        reason
      }
    });

    // Update booking status to DISPUTED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPUTED' }
    });

    // Notify all admins via email
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, name: true } });
    for (const admin of admins) {
      if (admin.email) {
        sendDisputeNotificationEmail(admin.email, admin.name, { bookingId, reason }).catch(err => {
          console.warn('Failed to send dispute notification email:', err.message);
        });
      }
    }

    res.json(dispute);
  } catch (error) {
    console.error(error);
    return routeErrorHandler(error, res);
  }
});

// Get all disputes (Admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            listing: true
          }
        },
        // SECURITY: explicit select — `user: true` would leak passwordHash,
        // refreshToken and other private columns into the admin browser.
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(disputes);
  } catch (error) {
    return routeErrorHandler(error, res);
  }
});

// Resolve a dispute (Admin only)
router.post('/:id/resolve', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    if (!CUID_RE.test(id)) return res.status(400).json({ error: 'Invalid ID format' });
    const { resolutionAction } = resolveDisputeSchema.parse(req.body);

    const dispute = await prisma.dispute.update({
      where: { id },
      data: { status: 'RESOLVED' }
    });

    // Update the booking status if requested
    if (resolutionAction) {
      const booking = await prisma.booking.findUnique({
        where: { id: dispute.bookingId },
        select: { status: true, totalAmount: true, serviceFee: true },
      });
      const data = { status: resolutionAction };
      // Mirror the /status route refund rule when cancelling a confirmed booking
      if (resolutionAction === 'CANCELLED' && booking?.status === 'CONFIRMED') {
        data.refundAmount = (booking.totalAmount || 0) - (booking.serviceFee || 0);
      }
      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data,
      });
    }

    // Notify the reporter of the outcome (in-app)
    const io = req.app.get('io');
    await createNotification(io, {
      userId: dispute.userId,
      type: 'BOOKING_UPDATE',
      title: 'Dispute resolved ✅',
      body: resolutionAction
        ? `Your report for booking ${dispute.bookingId} was resolved — the booking was marked ${resolutionAction}.`
        : `Your report for booking ${dispute.bookingId} was reviewed and resolved.`,
      link: '/bookings',
    });

    res.json({ message: 'Dispute resolved successfully' });
  } catch (error) {
    return routeErrorHandler(error, res);
  }
});

module.exports = router;
