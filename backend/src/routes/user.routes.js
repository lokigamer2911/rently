const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!req.params.id || !CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    // SECURITY: Exclude sensitive fields from response
    const { passwordHash: _1, refreshToken: _2, bankAccountNumber: _3, bankIfsc: _4, bankName: _5, firebaseUid: _6, failedLoginAttempts: _7, lockedUntil: _8, emailVerifyToken: _9, emailVerifyExpires: _10, passwordResetToken: _11, passwordResetExpires: _12, lastLoginIp: _13, ...rest } = user;
    res.json(rest);
  } catch (e) { next(e); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().max(500).optional(),
      bankAccountNumber: z.string().max(20).optional(),
      bankIfsc: z.string().max(11).optional(),
      bankName: z.string().max(100).optional(),
    }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    // SECURITY: Exclude sensitive fields from response
    const { passwordHash: _1, refreshToken: _2, bankAccountNumber: _3, bankIfsc: _4, bankName: _5, firebaseUid: _6, ...rest } = user;
    res.json(rest);
  } catch (e) { next(e); }
});

router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      address: z.string().min(10),
      idProofUrl: z.string().url(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...data,
        isVerified: true, // Auto-verify for now
      }
    });

    // SECURITY: Exclude sensitive fields from response
    const { passwordHash: _1, refreshToken: _2, bankAccountNumber: _3, bankIfsc: _4, bankName: _5, firebaseUid: _6, ...rest } = user;
    res.json({ message: 'Identity verified successfully', user: rest });
  } catch (e) { next(e); }
});

/**
 * Public host search — find vendors by name so renters can browse one
 * person's items. No auth required; only public fields are exposed.
 */
router.get('/search', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';
    if (q.length < 2) return res.json([]);
    const hosts = await prisma.user.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        isSuperhost: true,
        _count: { select: { listings: { where: { available: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(hosts.map((h) => ({
      id: h.id,
      name: h.name,
      avatarUrl: h.avatarUrl,
      bio: h.bio,
      isVerified: !!h.isVerified,
      isSuperhost: !!h.isSuperhost,
      listingsCount: h._count.listings,
    })));
  } catch (e) { next(e); }
});

/**
 * Public vendor storefront — profile header + rating stats.
 * Listings themselves come from GET /listings?ownerId=.
 */
router.get('/:id/profile', validateId, async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, avatarUrl: true, bio: true,
        isVerified: true, isSuperhost: true, createdAt: true,
        _count: { select: { listings: { where: { available: true } } } },
      },
    });
    if (!u || !u.name) return res.status(404).json({ error: 'Host not found' });
    const reviewStats = await prisma.review.aggregate({
      where: { listing: { ownerId: req.params.id } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    res.json({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      isVerified: !!u.isVerified,
      isSuperhost: !!u.isSuperhost,
      memberSince: u.createdAt,
      listingsCount: u._count.listings,
      averageRating: reviewStats._avg.rating,
      reviewCount: reviewStats._count.rating,
    });
  } catch (e) { next(e); }
});

router.get('/:id', requireAuth, validateId, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const u = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, avatarUrl: true, bio: true, createdAt: true },
    });
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (e) { next(e); }
});

module.exports = router;
