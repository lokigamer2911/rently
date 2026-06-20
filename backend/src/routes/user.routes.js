const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { z } = require('zod');

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { passwordHash, ...rest } = user;
    res.json(rest);
  } catch (e) { next(e); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    const { passwordHash, ...rest } = user;
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

    const { passwordHash, ...rest } = user;
    res.json({ message: 'Identity verified successfully', user: rest });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, avatarUrl: true, bio: true, createdAt: true },
    });
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (e) { next(e); }
});

module.exports = router;
