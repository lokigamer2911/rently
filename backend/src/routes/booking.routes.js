const router = require('express').Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');
const { createNotification, notifyWaitlist } = require('../utils/notifications');
const { sendBookingRequestEmail } = require('../utils/email');
const { createSignedResourceAccessToken, verifySignedResourceAccessToken } = require('../utils/access');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

/** Generate a cryptographically secure 6-digit OTP */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Rate limit OTP verification attempts to prevent brute-force attacks
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  max: 5,                   // max 5 attempts per window
  message: { error: 'Too many OTP attempts. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeListing(listing) {
  if (!listing) return listing;
  return { 
    ...listing, 
    images: parseJsonArray(listing.images),
    blockedDates: parseJsonArray(listing.blockedDates)
  };
}

function getAccessToken(req) {
  return req.query?.access || req.body?.access || null;
}

router.post('/:id/access', requireAuth, validateId, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.listing.ownerId === req.user.id;
    const isRenter = booking.renterId === req.user.id;
    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Forbidden' });

    const accessToken = createSignedResourceAccessToken(req.params.id, 'booking', req.user.id);
    res.json({ accessToken });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { listingId, startDate, endDate, depositType, depositNote } = z.object({
      listingId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      depositType: z.enum(['CASH', 'ALTERNATIVE']).default('CASH'),
      depositNote: z.string().optional(),
    }).parse(req.body);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid booking dates' });
    }
    if (end <= start) return res.status(400).json({ error: 'End must be after start' });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || !listing.available) return res.status(400).json({ error: 'Unavailable' });
    if (listing.ownerId === req.user.id) return res.status(400).json({ error: 'You cannot book your own listing' });

    // Conflict check (Bookings) — includes PICKED_UP to prevent double-booking
    const overlap = await prisma.booking.findFirst({
      where: {
        listingId, status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP'] },
        AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
      },
    });
    if (overlap) return res.status(409).json({ error: 'Dates already booked' });

    // Conflict check (Blocked Dates)
    const blockedDates = parseJsonArray(listing.blockedDates);
    const hasBlockedOverlap = blockedDates.some(dateStr => {
      const bDate = new Date(dateStr);
      const sDate = new Date(start.toISOString().split('T')[0]);
      const eDate = new Date(end.toISOString().split('T')[0]);
      return bDate >= sDate && bDate <= eDate;
    });
    if (hasBlockedOverlap) return res.status(409).json({ error: 'Selected dates include blocked dates' });

    const days = Math.ceil((end - start) / 86400000);
    const rentalAmount = days * listing.pricePerDay;
    const serviceFee = Math.round(rentalAmount * 0.05);
    const depositAmount = depositType === 'CASH' ? listing.deposit : 0;
    const totalAmount = rentalAmount + serviceFee + depositAmount;
    const handoverOTP = generateOTP();

    // Create booking — race condition window is small (between overlap check and create).
    // For higher scale, use SELECT FOR UPDATE or a DB-level unique constraint on date ranges.
    const booking = await prisma.booking.create({
      data: {
        listingId,
        renterId: req.user.id,
        startDate: start,
        endDate: end,
        serviceFee,
        totalAmount,
        depositType,
        depositNote,
        handoverOTP
      },
    });

    // Notify owner (Real-time + email)
    const io = req.app.get('io');
    await createNotification(io, {
      userId: listing.ownerId,
      type: 'BOOKING_REQUEST',
      title: 'New booking request! 📦',
      body: `Someone wants to rent your ${listing.title}. View details now.`,
      link: '/bookings',
    });

    // Send email notification to owner
    const owner = await prisma.user.findUnique({ where: { id: listing.ownerId }, select: { email: true, name: true } });
    if (owner?.email) {
      sendBookingRequestEmail(owner.email, owner.name, { listing, startDate: start, endDate: end }).catch(err => {
        console.warn('Failed to send booking request email:', err.message);
      });
    }

    // Notify renter of their Pickup OTP
    await createNotification(io, {
      userId: req.user.id,
      type: 'BOOKING_UPDATE',
      title: 'Your Pickup OTP 🔑',
      body: `Your pickup code for ${listing.title} is ${handoverOTP}. Give this to the host when you collect the item.`,
      link: '/bookings',
    });

    // SECURITY: Don't expose OTPs in HTTP response — they're sent via notification only
    const { handoverOTP: _h, returnOTP: _r, ...bookingSafe } = booking;
    res.json(bookingSafe);
  } catch (e) { next(e); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { renterId: req.user.id },
      include: { 
        listing: { include: { owner: { select: { name: true, avatarUrl: true } } } }, 
        payment: true 
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings.map(b => ({ ...b, listing: normalizeListing(b.listing) })));
  } catch (e) { next(e); }
});

router.get('/incoming', requireAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({      where: { listing: { ownerId: req.user.id } },
      include: { 
        listing: { include: { owner: { select: { name: true, avatarUrl: true } } } }, 
        renter: { select: { id: true, name: true, avatarUrl: true } },
        payment: true 
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings.map(b => ({ ...b, listing: normalizeListing(b.listing) })));
  } catch (e) { next(e); }
});

router.patch('/:id/status', requireAuth, validateId, async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }, include: { listing: { include: { owner: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.listing.ownerId === req.user.id;
    const isRenter = booking.renterId === req.user.id;
    if (!isOwner && !isRenter) return res.status(404).json({ error: 'Not found' });
    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Forbidden' });

    const canTransition =
      (status === 'CONFIRMED' && isOwner && booking.status === 'PENDING') ||
      (status === 'CANCELLED' && (isOwner || isRenter) && ['PENDING', 'CONFIRMED'].includes(booking.status)) ||
      (status === 'COMPLETED' && isRenter && booking.status === 'CONFIRMED');

    if (!canTransition) {
      return res.status(400).json({
        error: `Cannot change booking from ${booking.status} to ${status}`,
      });
    }

    const data = { status };

    // Calculate refund if cancelling a paid/confirmed booking
    if (status === 'CANCELLED' && booking.status === 'CONFIRMED') {
      data.refundAmount = booking.totalAmount - booking.serviceFee;
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id }, data,
    });

    // Update listing visibility based on booking status
    if (status === 'CONFIRMED') {
      await prisma.listing.update({
        where: { id: booking.listingId },
        data: { available: false }
      });
    } else if (status === 'CANCELLED' || status === 'COMPLETED') {
      await prisma.listing.update({
        where: { id: booking.listingId },
        data: { available: true }
      });
    }

    // Notify the other party (real-time + email)
    const io = req.app.get('io');
    const targetUserId = isOwner ? booking.renterId : booking.listing.ownerId;
    const roleName = isOwner ? 'Host' : 'Renter';

    await createNotification(io, {
      userId: targetUserId,
      type: 'BOOKING_UPDATE',
      title: `Booking Update: ${status} ✅`,
      body: `The ${roleName} has ${status.toLowerCase()} the booking for ${booking.listing.title}.`,
      link: '/bookings',
    });

    // Send email for confirmed bookings
    if (status === 'CONFIRMED') {
      const { sendBookingConfirmationEmail } = require('../utils/email');
      const renter = await prisma.user.findUnique({ where: { id: booking.renterId }, select: { email: true, name: true } });
      if (renter?.email) {
        sendBookingConfirmationEmail(renter.email, renter.name, { listing: booking.listing, startDate: booking.startDate, endDate: booking.endDate, totalAmount: booking.totalAmount }).catch(err => {
          console.warn('Failed to send booking confirmation email:', err.message);
        });
      }
    }

    // Notify waitlist if item became available
    if (status === 'CANCELLED' || status === 'COMPLETED') {
      await notifyWaitlist(io, booking.listingId);
    }

    res.json(updated);
  } catch (e) { next(e); }
});

// Verify Pickup (OTP + Photos + Signatures) — rate limited to prevent brute-force
router.patch('/:id/pickup', requireAuth, validateId, otpVerifyLimiter, async (req, res, next) => {
  try {
    const { otp, photos, signatures } = z.object({
      otp: z.string().length(6),
      photos: z.array(z.string().url()).default([]),
      signatures: z.object({
        renter: z.string().optional(),
        host: z.string().optional(),
      }).optional(),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true }
    });

    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (booking.listing.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    if (booking.status !== 'CONFIRMED') return res.status(400).json({ error: 'Booking must be confirmed first' });

    if (booking.handoverOTP !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    const returnOTP = generateOTP();

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'PICKED_UP',
        pickupPhotos: JSON.stringify(photos),
        pickupSignatures: JSON.stringify(signatures || {}),
        handoverAt: new Date(),
        returnOTP
      }
    });

    // Notify renter of their Return OTP
    const io = req.app.get('io');
    await createNotification(io, {
      userId: booking.renterId,
      type: 'BOOKING_UPDATE',
      title: 'Your Return OTP 🔑',
      body: `Your return code for ${booking.listing.title} is ${returnOTP}. Give this to the host when you return the item.`,
      link: '/bookings',
    });

    res.json(updated);
  } catch (e) { next(e); }
});

// Verify Return (OTP + Photos + Signatures) — rate limited to prevent brute-force
router.patch('/:id/return', requireAuth, validateId, otpVerifyLimiter, async (req, res, next) => {
  try {
    const { otp, photos, signatures } = z.object({
      otp: z.string().length(6),
      photos: z.array(z.string().url()).default([]),
      signatures: z.object({
        renter: z.string().optional(),
        host: z.string().optional(),
      }).optional(),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { listing: true }
    });

    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (booking.listing.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    if (booking.status !== 'PICKED_UP') return res.status(400).json({ error: 'Item must be picked up first' });

    if (booking.returnOTP !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        returnPhotos: JSON.stringify(photos),
        returnSignatures: JSON.stringify(signatures || {}),
        returnAt: new Date()
      }
    });

    // Make listing available again
    await prisma.listing.update({
      where: { id: booking.listingId },
      data: { available: true }
    });

    res.json(updated);
  } catch (e) { next(e); }
});

// GET Timeline for a booking
router.get('/:id/timeline', requireAuth, validateId, async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken && !verifySignedResourceAccessToken(accessToken, req.params.id, 'booking', req.user.id)) {
      return res.status(403).json({ error: 'Invalid or expired access link' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        listing: {
          include: { owner: { select: { id: true, name: true, avatarUrl: true } } }
        },
        renter: { select: { id: true, name: true, avatarUrl: true } },
      }
    });

    if (!booking) return res.status(404).json({ error: 'Not found' });

    const isOwner = booking.listing.ownerId === req.user.id;
    const isRenter = booking.renterId === req.user.id;
    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Forbidden' });

    const listingImages = parseJsonArray(booking.listing.images);
    const pickupPhotos = parseJsonArray(booking.pickupPhotos);
    const returnPhotos = parseJsonArray(booking.returnPhotos);

    let pickupSignatures = null;
    let returnSignatures = null;
    try {
      pickupSignatures = JSON.parse(booking.pickupSignatures || '{}');
    } catch (err) {
      pickupSignatures = {};
    }
    try {
      returnSignatures = JSON.parse(booking.returnSignatures || '{}');
    } catch (err) {
      returnSignatures = {};
    }

    const events = [];

    // 1. Item Listed
    events.push({
      id: 'listed',
      type: 'LISTED',
      label: 'Item Listed',
      description: `${booking.listing.owner.name || 'Host'} listed "${booking.listing.title}" on Rently.`,
      timestamp: booking.listing.createdAt,
      actor: { role: 'Host', name: booking.listing.owner.name, avatarUrl: booking.listing.owner.avatarUrl },
      photos: listingImages.slice(0, 4),
      status: 'done',
    });

    // 2. Booking Requested
    events.push({
      id: 'booked',
      type: 'BOOKED',
      label: 'Booking Requested',
      description: `${booking.renter.name || 'Renter'} requested to rent this item.`,
      timestamp: booking.createdAt,
      actor: { role: 'Renter', name: booking.renter.name, avatarUrl: booking.renter.avatarUrl },
      photos: [],
      status: 'done',
    });

    // 3. Confirmed
    const confirmedStatuses = ['CONFIRMED', 'PICKED_UP', 'COMPLETED'];
    events.push({
      id: 'confirmed',
      type: 'CONFIRMED',
      label: 'Booking Confirmed',
      description: booking.status === 'CANCELLED'
        ? 'This booking was cancelled.'
        : confirmedStatuses.includes(booking.status)
          ? `${booking.listing.owner.name || 'Host'} confirmed the booking.`
          : 'Awaiting host confirmation.',
      timestamp: confirmedStatuses.includes(booking.status) ? booking.createdAt : null,
      actor: { role: 'Host', name: booking.listing.owner.name, avatarUrl: booking.listing.owner.avatarUrl },
      photos: [],
      status: booking.status === 'CANCELLED' ? 'cancelled' : confirmedStatuses.includes(booking.status) ? 'done' : 'pending',
    });

    // 4. Picked Up
    const pickedUpStatuses = ['PICKED_UP', 'COMPLETED'];
    events.push({
      id: 'pickup',
      type: 'PICKUP',
      label: 'Picked Up',
      description: pickedUpStatuses.includes(booking.status)
        ? `${booking.renter.name || 'Renter'} picked up the item. Condition documented.`
        : 'Renter has not yet picked up the item.',
      timestamp: booking.handoverAt || null,
      actor: { role: 'Host', name: booking.listing.owner.name, avatarUrl: booking.listing.owner.avatarUrl },
      photos: pickupPhotos,
      signatures: pickupSignatures,
      status: pickedUpStatuses.includes(booking.status) ? 'done' : 'pending',
    });

    // 5. Returned
    events.push({
      id: 'returned',
      type: 'RETURNED',
      label: 'Returned',
      description: booking.status === 'COMPLETED'
        ? `${booking.renter.name || 'Renter'} returned the item. Condition verified.`
        : 'Item has not been returned yet.',
      timestamp: booking.returnAt || null,
      actor: { role: 'Host', name: booking.listing.owner.name, avatarUrl: booking.listing.owner.avatarUrl },
      photos: returnPhotos,
      signatures: returnSignatures,
      status: booking.status === 'COMPLETED' ? 'done' : 'pending',
    });

    res.json({
      bookingId: booking.id,
      listingTitle: booking.listing.title,
      listingId: booking.listing.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      currentStatus: booking.status,
      events,
    });
  } catch (e) { next(e); }
});

module.exports = router;

