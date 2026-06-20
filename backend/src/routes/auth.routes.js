const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const admin = require('../config/firebase');
const { signToken } = require('../utils/jwt');

// Email + password signup
router.post('/signup', async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash },
    });
    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (e) { next(e); }
});

// Email + password login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (e) { next(e); }
});

// Firebase exchange — works for Google login AND Phone OTP
// Frontend signs in with Firebase, then sends idToken here for our JWT
router.post('/firebase', async (req, res, next) => {
  try {
    const { idToken } = z.object({ idToken: z.string() }).parse(req.body);
    const decoded = await admin.auth().verifyIdToken(idToken);

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) {
      if (decoded.email) {
        user = await prisma.user.findUnique({ where: { email: decoded.email } });
      }

      if (!user && decoded.phone_number) {
        user = await prisma.user.findUnique({ where: { phone: decoded.phone_number } });
      }
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: user.firebaseUid || decoded.uid,
          email: user.email || decoded.email || null,
          phone: user.phone || decoded.phone_number || null,
          name: user.name || decoded.name || decoded.email?.split('@')[0] || 'User',
          avatarUrl: user.avatarUrl || decoded.picture || null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || null,
          phone: decoded.phone_number || null,
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          avatarUrl: decoded.picture || null,
        },
      });
    }

    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (e) { next(e); }
});

function sanitize(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

module.exports = router;
