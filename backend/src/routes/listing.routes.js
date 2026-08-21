const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');
const { createSignedResourceAccessToken, verifySignedResourceAccessToken } = require('../utils/access');

// CUID v1/v2 regex — fast guard before hitting the DB
const CUID_RE = /^c[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeJsonArray(arr) {
  return JSON.stringify(Array.isArray(arr) ? arr : []);
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

const ListingInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerDay: z.number().int().positive(),
  deposit: z.number().int().nonnegative().default(0),
  depositNote: z.string().optional(),
  city: z.string(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  images: z.array(z.string().url()).default([]),
  blockedDates: z.array(z.string()).default([]),
  categoryId: z.string(),
  requiresVerification: z.boolean().default(false),
});

router.get('/user/me', requireAuth, async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      include: { category: true, bookings: { where: { status: 'CONFIRMED' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings.map(normalizeListing));
  } catch (e) { next(e); }
});

router.get('/earnings/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 1. Get all confirmed/completed bookings for my listings
    const bookings = await prisma.booking.findMany({
      where: {
        listing: { ownerId: userId },
        status: { in: ['CONFIRMED', 'PICKED_UP', 'COMPLETED'] }
      },
      include: {
        listing: { select: { id: true, title: true, pricePerDay: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Aggregate stats
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const completedRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingRevenue = totalRevenue - completedRevenue;

    // 3. Monthly breakdown (last 6 months)
    const monthlyData = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    // Initialize months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      monthlyData[monthKey] = 0;
    }

    bookings.forEach(b => {
      const monthKey = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += b.totalAmount;
      }
    });

    const chartData = Object.keys(monthlyData).reverse().map(key => ({
      month: key,
      earnings: monthlyData[key] / 100
    }));

    // 4. Performance by item
    const itemStats = {};
    bookings.forEach(b => {
      if (!itemStats[b.listingId]) {
        itemStats[b.listingId] = {
          id: b.listingId,
          title: b.listing.title,
          revenue: 0,
          bookings: 0,
          pricePerDay: b.listing.pricePerDay
        };
      }
      itemStats[b.listingId].revenue += b.totalAmount;
      itemStats[b.listingId].bookings += 1;
    });

    const topItems = Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      summary: {
        totalRevenue,
        completedRevenue,
        pendingRevenue,
        bookingCount: bookings.length
      },
      chartData,
      topItems
    });
  } catch (e) { next(e); }
});

router.get('/stats/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Total Earnings from confirmed bookings on user's listings
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        listing: { ownerId: userId },
        status: 'CONFIRMED'
      },
      select: { totalAmount: true }
    });

    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Active rentals (currently within start/end dates)
    const now = new Date();
    const activeRentalsCount = await prisma.booking.count({
      where: {
        listing: { ownerId: userId },
        status: 'CONFIRMED',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    // Total listings count
    const totalListings = await prisma.listing.count({ where: { ownerId: userId } });

    // Recent incoming bookings
    const incomingBookings = await prisma.booking.findMany({
      where: { listing: { ownerId: userId } },
      include: { 
        listing: { select: { title: true, images: true } },
        renter: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      totalEarnings,
      activeRentalsCount,
      totalListings,
      incomingBookings: incomingBookings.map(b => ({ ...b, listing: normalizeListing(b.listing) }))
    });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { q, city, categoryId, minPrice, maxPrice, lat, lng, radius, minRating } = req.query;
    const where = { available: true };
    // SECURITY: Limit search query length to prevent performance abuse
    const sanitizedQ = typeof q === 'string' ? q.trim().slice(0, 100) : null;
    if (sanitizedQ) where.title = { contains: sanitizedQ, mode: 'insensitive' };
    
    if (lat && lng && radius) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radNum = parseFloat(radius);
      const latDelta = radNum / 111;
      const lngDelta = radNum / (111 * Math.cos((latNum * Math.PI) / 180));
      
      where.lat = { gte: latNum - latDelta, lte: latNum + latDelta };
      where.lng = { gte: lngNum - lngDelta, lte: lngNum + lngDelta };
    } else if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }
    
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) where.pricePerDay = {
      gte: minPrice ? +minPrice : undefined,
      lte: maxPrice ? +maxPrice : undefined,
    };
    
    const listings = await prisma.listing.findMany({
      where,
      include: { 
        category: true, 
        owner: { select: { id: true, name: true, avatarUrl: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    let filteredListings = listings;
    if (minRating) {
      const ratingThreshold = parseFloat(minRating);
      filteredListings = listings.filter(l => {
        if (l.reviews.length === 0) return false;
        const avg = l.reviews.reduce((sum, r) => sum + r.rating, 0) / l.reviews.length;
        return avg >= ratingThreshold;
      });
    }

    const responseListings = filteredListings.map(l => {
      const avgRating = l.reviews.length ? l.reviews.reduce((sum, r) => sum + r.rating, 0) / l.reviews.length : 0;
      const { reviews: _reviews, ...rest } = l;
      return { ...normalizeListing(rest), averageRating: avgRating };
    });
    
    res.json(responseListings);
  } catch (e) { next(e); }
});

router.post('/:id/access', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const isOwner = listing.ownerId === req.user.id;
    const isRenter = await prisma.booking.findFirst({
      where: { listingId: req.params.id, renterId: req.user.id },
      select: { id: true },
    });

    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Forbidden' });

    const accessToken = createSignedResourceAccessToken(req.params.id, 'listing', req.user.id);
    res.json({ accessToken });
  } catch (e) { next(e); }
});

router.get('/:id', validateId, async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken && !verifySignedResourceAccessToken(accessToken, req.params.id, 'listing')) {
      return res.status(403).json({ error: 'Invalid or expired access link' });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        // NOTE: email/phone intentionally excluded from public response (privacy)
        owner: { select: { id: true, name: true, avatarUrl: true, bio: true, isVerified: true, isSuperhost: true } },
        reviews: { include: { author: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Parse review photos
    if (listing.reviews) {
      listing.reviews = listing.reviews.map(r => ({
        ...r,
        photos: JSON.parse(r.photos || '[]')
      }));
    }

    res.json(normalizeListing(listing));
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = ListingInput.parse(req.body);
    const listing = await prisma.listing.create({
      data: { 
        ...data, 
        images: serializeJsonArray(data.images), 
        blockedDates: serializeJsonArray(data.blockedDates),
        ownerId: req.user.id 
      },
    });
    res.json(normalizeListing(listing));
  } catch (e) { next(e); }
});

router.patch('/:id', validateId, requireAuth, async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken && !verifySignedResourceAccessToken(accessToken, req.params.id, 'listing', req.user.id)) {
      return res.status(403).json({ error: 'Invalid or expired access link' });
    }

    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const data = ListingInput.partial().parse(req.body);
    const updateData = {
      ...data,
      ...(data.images ? { images: serializeJsonArray(data.images) } : {}),
      ...(data.blockedDates ? { blockedDates: serializeJsonArray(data.blockedDates) } : {}),
    };
    res.json(normalizeListing(await prisma.listing.update({ where: { id: req.params.id }, data: updateData })));
  } catch (e) { next(e); }
});

router.delete('/:id', validateId, requireAuth, async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken && !verifySignedResourceAccessToken(accessToken, req.params.id, 'listing', req.user.id)) {
      return res.status(403).json({ error: 'Invalid or expired access link' });
    }

    const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ error: 'Forbidden' });
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Booked date ranges for availability calendar
router.get('/:id/availability', validateId, async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken && !verifySignedResourceAccessToken(accessToken, req.params.id, 'listing')) {
      return res.status(403).json({ error: 'Invalid or expired access link' });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      select: { blockedDates: true },
    });
    const bookings = await prisma.booking.findMany({
      where: { listingId: req.params.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { startDate: true, endDate: true },
    });
    res.json({
      bookings,
      blockedDates: parseJsonArray(listing?.blockedDates)
    });
  } catch (e) { next(e); }
});

router.post('/:id/alert', validateId, requireAuth, async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const userId = req.user.id;

    const alert = await prisma.alert.upsert({
      where: {
        userId_listingId: { userId, listingId }
      },
      update: {},
      create: { userId, listingId }
    });

    res.json({ ok: true, alert });
  } catch (e) { next(e); }
});

router.post('/ai-suggest', requireAuth, async (req, res, next) => {
  try {
    const { model } = req.body;
    if (!model || typeof model !== 'string' || model.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a model name of at least 3 characters' });
    }

    // Fetch active categories to pass to prompt
    let categories = [];
    try {
      categories = await prisma.category.findMany();
      if (!categories || categories.length === 0) throw new Error('No categories in DB');
    } catch (dbError) {
      console.warn('Prisma database categories fetch failed, using default mock categories:', dbError.message);
      categories = [
        { id: 'cat_elect', name: 'Electronics', slug: 'electronics' },
        { id: 'cat_cars', name: 'Cars', slug: 'cars' },
        { id: 'cat_bikes', name: 'Bikes', slug: 'bikes' },
        { id: 'cat_tools', name: 'Tools & Equipment', slug: 'tools-equipment' },
        { id: 'cat_photo', name: 'Photography & Video', slug: 'photography-video' },
        { id: 'cat_camp', name: 'Camping & Outdoors', slug: 'camping-outdoors' }
      ];
    }
    const catListStr = categories.map(c => `- ${c.name} (slug: ${c.slug})`).join('\n');

    let aiResult = null;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `You are a helpful product description and pricing assistant for Rentrex, a premium P2P rental platform.
The user wants to list this item for rent: "${model}".

Available categories (you must match the item to exactly one of these category slugs):
${catListStr}

Generate a JSON object containing details for this rental listing. The JSON object must have exactly the following keys:
1. "title": A polished, professional listing title (e.g. brand + model + key feature).
2. "description": A highly compelling, detailed, and SEO-friendly rental description, listing inclusions and key specs.
3. "categorySlug": The slug of the single best fitting category from the list above.
4. "suggestedPricePerDay": An optimal daily rental price in INR (integer, e.g. 500) considering the retail value of the item.
5. "suggestedDeposit": A suitable security deposit in INR (integer, e.g. 3000).
6. "suggestedDepositNote": A default collateral recommendation (e.g. "Aadhaar Card copy or post-dated cheque").

Return ONLY a raw JSON object. Do not wrap it in markdown code blocks like \`\`\`json.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            aiResult = JSON.parse(text.trim());
          }
        } else {
          console.warn(`Gemini API returned status ${response.status}`);
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, running fallback:', geminiError);
      }
    }

    // Fallback if Gemini key is missing or API call failed
    if (!aiResult) {
      console.log('Using local rule-based fallback for AI suggestions');
      const lowerModel = model.toLowerCase();
      let categorySlug = 'electronics';
      let title = model;
      let description = `High-quality ${model} available for rent. Well-maintained, fully functional, and ready to use. Perfect for personal or professional projects. Please message for specifications and availability.`;
      let suggestedPricePerDay = 500;
      let suggestedDeposit = 3000;
      let suggestedDepositNote = 'Original Govt ID (Aadhaar/Driver License) or equivalent security deposit.';

      if (lowerModel.includes('camera') || lowerModel.includes('lens') || lowerModel.includes('sony') || lowerModel.includes('canon') || lowerModel.includes('nikon') || lowerModel.includes('fuji') || lowerModel.includes('gopro') || lowerModel.includes('tripod') || lowerModel.includes('photography') || lowerModel.includes('video')) {
        categorySlug = 'photography-video';
        title = model.match(/(sony|canon|nikon|fuji|gopro)/i) ? model : `Premium ${model}`;
        description = `Professional-grade ${model} in pristine condition. Excellent for photography, videography, or cinematic projects. Includes standard accessories (battery, charger, and carrying bag). Checked and sanitized before every rental.`;
        suggestedPricePerDay = 1500;
        suggestedDeposit = 8000;
      } else if (lowerModel.includes('car') || lowerModel.includes('suv') || lowerModel.includes('auto') || lowerModel.includes('bmw') || lowerModel.includes('audi') || lowerModel.includes('honda')) {
        categorySlug = 'cars';
        description = `Well-maintained ${model} available for rent. Clean interiors, fully serviced, excellent mileage, and perfect for road trips or daily commute. Comprehensive insurance copy included.`;
        suggestedPricePerDay = 3000;
        suggestedDeposit = 15000;
      } else if (lowerModel.includes('bike') || lowerModel.includes('scooter') || lowerModel.includes('cycle') || lowerModel.includes('royal enfield') || lowerModel.includes('activa')) {
        categorySlug = 'bikes';
        description = `Reliable ${model} for rent. Serviced regularly, pristine running condition, excellent mileage, helmet included upon request. Great for city rides or quick weekend getaways.`;
        suggestedPricePerDay = 600;
        suggestedDeposit = 3000;
      } else if (lowerModel.includes('drill') || lowerModel.includes('tool') || lowerModel.includes('dewalt') || lowerModel.includes('bosch') || lowerModel.includes('saw') || lowerModel.includes('ladder') || lowerModel.includes('equipment')) {
        categorySlug = 'tools-equipment';
        description = `Heavy-duty professional ${model}. Highly reliable, powerful, and easy to operate. Suitable for home improvement, woodworking, or minor construction projects. Comes with the carrying case and necessary bits/blades.`;
        suggestedPricePerDay = 400;
        suggestedDeposit = 2000;
      } else if (lowerModel.includes('tent') || lowerModel.includes('camp') || lowerModel.includes('hiking') || lowerModel.includes('sleeping bag') || lowerModel.includes('outdoor') || lowerModel.includes('trek')) {
        categorySlug = 'camping-outdoors';
        description = `High-durability ${model} ideal for camping, outdoor excursions, or trekking. Lightweight, weatherproof, easy to set up. Cleaned and sanitized after every trip.`;
        suggestedPricePerDay = 350;
        suggestedDeposit = 1500;
      } else if (lowerModel.includes('laptop') || lowerModel.includes('macbook') || lowerModel.includes('monitor') || lowerModel.includes('tv') || lowerModel.includes('projector') || lowerModel.includes('phone') || lowerModel.includes('ipad') || lowerModel.includes('playstation') || lowerModel.includes('xbox')) {
        categorySlug = 'electronics';
        description = `High-performance ${model} in perfect working condition. Ideal for gaming, remote work, presentations, or entertainment. Comes with all power cables and standard accessories.`;
        suggestedPricePerDay = 800;
        suggestedDeposit = 5000;
      }

      aiResult = {
        title,
        description,
        categorySlug,
        suggestedPricePerDay,
        suggestedDeposit,
        suggestedDepositNote
      };
    }

    const matchedCategory = categories.find(c => c.slug === aiResult.categorySlug) || categories[0];
    const categoryId = matchedCategory ? matchedCategory.id : '';

    res.json({
      title: aiResult.title || model,
      description: aiResult.description || '',
      categoryId,
      categorySlug: matchedCategory ? matchedCategory.slug : '',
      pricePerDay: aiResult.pricePerDay || aiResult.suggestedPricePerDay || 500,
      deposit: aiResult.deposit || aiResult.suggestedDeposit || 2000,
      depositNote: aiResult.depositNote || aiResult.suggestedDepositNote || ''
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
