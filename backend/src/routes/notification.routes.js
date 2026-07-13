const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const list = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json(list);
  } catch (e) { next(e); }
});

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id }, data: { read: true },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
