const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const admin = require('../config/firebase');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { cookieOptions } = require('../utils/cookie');

// Password must be ≥8 chars, contain at least 1 letter AND 1 number/special char
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one number or special character');

// Email + password signup
router.post('/signup', async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: strongPassword,
      name: z.string().min(1),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash },
    });
    
    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({ token, user: sanitize(user) });
  } catch (e) { next(e); }
});

// Email + password login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1), // Login: no complexity check (allow existing accounts)
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({ token, user: sanitize(user) });
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

    const token = signToken(user);
    res.cookie('token', token, cookieOptions);
    res.json({ token, user: sanitize(user) });
  } catch (e) { next(e); }
});

// Server-side logout — increments tokenVersion to invalidate ALL active tokens for this user
// This means logging out on one device invalidates sessions on all other devices too
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });
    res.clearCookie('token', cookieOptions);
    res.json({ ok: true, message: 'Logged out successfully. All sessions have been terminated.' });
  } catch (e) { next(e); }
});

function sanitize(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

module.exports = router;
