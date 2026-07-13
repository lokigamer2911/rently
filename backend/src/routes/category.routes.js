const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { z } = require('zod');

router.get('/', async (_req, res, next) => {
  try { res.json(await prisma.category.findMany({ orderBy: { name: 'asc' } })); }
  catch (e) { next(e); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string(), slug: z.string(), icon: z.string().optional(),
    }).parse(req.body);
    res.json(await prisma.category.create({ data }));
  } catch (e) { next(e); }
});

module.exports = router;
