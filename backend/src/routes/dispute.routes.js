const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Create a new dispute for a booking
router.post('/:bookingId', requireAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

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

    res.json(dispute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to report issue' });
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
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// Resolve a dispute (Admin only)
router.post('/:id/resolve', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { resolutionAction } = req.body; // e.g., 'CANCELLED', 'COMPLETED'

    const dispute = await prisma.dispute.update({
      where: { id },
      data: { status: 'RESOLVED' }
    });

    // Update the booking status if requested
    if (resolutionAction) {
      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data: { status: resolutionAction }
      });
    }

    res.json({ message: 'Dispute resolved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

module.exports = router;
