const router = require('express').Router();
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const CUID_RE = /^[a-z0-9]{20,}$/i;
function validateId(req, res, next) {
  if (!CUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

// Get all threads for current user
router.get('/threads', requireAuth, async (req, res, next) => {
  try {
    const threads = await prisma.thread.findMany({
      where: {
        OR: [{ userAId: req.user.id }, { userBId: req.user.id }]
      },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(threads);
  } catch (e) { next(e); }
});

// Get messages for a thread (paginated — newest 50 by default, load older via ?before=<messageId>)
router.get('/threads/:id', requireAuth, validateId, async (req, res, next) => {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: req.params.id },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, avatarUrl: true } },
      }
    });

    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.userAId !== req.user.id && thread.userBId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Pagination: ?before=<messageId> loads older messages, ?limit=N (max 100)
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    const where = { threadId: req.params.id };
    if (before) {
      // Fetch the cursor message's createdAt to paginate before it
      const cursorMsg = await prisma.message.findUnique({ where: { id: before }, select: { createdAt: true } });
      if (cursorMsg) {
        where.createdAt = { lt: cursorMsg.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to know if there are more
    });

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      thread: { id: thread.id, userA: thread.userA, userB: thread.userB, userAId: thread.userAId, userBId: thread.userBId },
      messages: result.reverse(), // return in ascending order
      hasMore,
      nextCursor: hasMore ? result[0]?.id : null,
    });
  } catch (e) { next(e); }
});

// Start or get a thread with another user
router.post('/threads', requireAuth, async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    if (targetUserId === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });

    // Ensure userAId < userBId for unique constraint
    const [u1, u2] = [req.user.id, targetUserId].sort();

    const thread = await prisma.thread.upsert({
      where: {
        userAId_userBId: { userAId: u1, userBId: u2 }
      },
      update: {},
      create: {
        userAId: u1,
        userBId: u2
      },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true } },
        userB: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.json(thread);
  } catch (e) { next(e); }
});

// Get a support admin to talk to
router.get('/support-admin', requireAuth, async (req, res, next) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, avatarUrl: true }
    });
    if (!admin) return res.status(404).json({ error: 'No support staff available right now.' });
    res.json(admin);
  } catch (e) { next(e); }
});

module.exports = router;
