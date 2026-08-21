const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { z } = require('zod');

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

router.delete('/listings/:id', validateId, async (req, res, next) => {
  try {
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
