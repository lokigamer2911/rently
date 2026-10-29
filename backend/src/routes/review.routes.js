const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { bookingId, rating, comment, photos } = z.object({
      bookingId: z.string(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
      photos: z.array(z.string().url()).optional().default([]),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'COMPLETED') return res.status(403).json({ error: 'Booking must be completed to leave a review' });

    let targetId;
    let authorId = req.user.id;

    if (authorId === booking.renterId) {
      targetId = booking.listing.ownerId; // Renter reviewing host
    } else if (authorId === booking.listing.ownerId) {
      targetId = booking.renterId; // Host reviewing renter
    } else {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { bookingId, authorId }
    });
    if (existing) return res.status(400).json({ error: 'You have already reviewed this booking' });

    const review = await prisma.review.create({
      data: {
        listingId: booking.listingId,
        bookingId,
        authorId,
        targetId,
        rating,
        comment,
        photos: JSON.stringify(photos)
      },
    });

    // Superhost calculation (only if target is the host)
    if (targetId === booking.listing.ownerId) {
      const stats = await prisma.review.aggregate({
        where: { targetId },
        _avg: { rating: true }
      });

      const completedBookings = await prisma.booking.count({
        where: { listing: { ownerId: targetId }, status: 'COMPLETED' }
      });

      if (stats._avg.rating >= 4.8 && completedBookings >= 10) {
        await prisma.user.update({
          where: { id: targetId },
          data: { isSuperhost: true }
        });
      }
    }

    res.json(review);
  } catch (e) { next(e); }
});

router.get('/listing/:id', validateId, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { listingId: req.params.id },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Parse photos
    const formatted = reviews.map(r => ({
      ...r,
      photos: JSON.parse(r.photos || '[]')
    }));
    res.json(formatted);
  } catch (e) { next(e); }
});

module.exports = router;
