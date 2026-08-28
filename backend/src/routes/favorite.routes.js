const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const CUID_RE = /^c[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.listingId)) {
    return res.status(400).json({ error: 'Invalid listing ID format' });
  }
  next();
}

// Get all favorites for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            category: true,
            owner: { select: { id: true, name: true, avatarUrl: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = favorites.map(f => {
      const listing = f.listing;
      const avgRating = listing.reviews.length
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
        : 0;
      let images = [];
      try { images = JSON.parse(listing.images || '[]'); } catch { images = []; }
      return {
        ...listing,
        images,
        averageRating: avgRating,
        favoritedAt: f.createdAt,
      };
    });

    res.json(result);
  } catch (e) { next(e); }
});

// Check if a listing is favorited by current user
router.get('/check/:listingId', requireAuth, validateId, async (req, res, next) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId: req.params.listingId } },
    });
    res.json({ isFavorited: !!favorite });
  } catch (e) { next(e); }
});

// Toggle favorite (add if not exists, remove if exists)
router.post('/toggle/:listingId', requireAuth, validateId, async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ isFavorited: false });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user.id, listingId },
      });
      res.json({ isFavorited: true });
    }
  } catch (e) { next(e); }
});

module.exports = router;
