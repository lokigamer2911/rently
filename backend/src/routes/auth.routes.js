const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const firebaseAdmin = require('../config/firebase');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { cookieOptions, refreshCookieOptions } = require('../utils/cookie');
const { requireAuth } = require('../middleware/auth');
const { createExpiringToken, compareToken } = require('../utils/tokens');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { csrfTokenEndpoint } = require('../middleware/csrf');
const logger = require('../utils/logger');

// ─── Constants ───────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

// ─── Password Policy ────────────────────────────────────────
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d|[^a-zA-Z0-9]/, 'Password must contain at least one number or special character');

// ─── Helpers ────────────────────────────────────────────────

/** Strip all sensitive fields from user object before sending to client */
function sanitize(u) {
  if (!u) return u;
  const { 
    passwordHash: _1,
    refreshToken: _2,
    failedLoginAttempts: _3,
    lockedUntil: _4,
    emailVerifyToken: _5,
    emailVerifyExpires: _6,
    passwordResetToken: _7,
    passwordResetExpires: _8,
    tokenVersion: _9,
    firebaseUid: _10,
    lastLoginIp: _11,
    userAgent: _12,
    ...safe 
  } = u;
  return safe;
}

/** Check if account is locked */
function isLocked(user) {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
}

/** Set both access + refresh cookies + return tokens */
function setAuthCookies(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie('token', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return { accessToken, refreshToken };
}

// ─── CSRF Token Endpoint ────────────────────────────────────
router.get('/csrf-token', csrfTokenEndpoint);

// Rate limit Firebase exchange to prevent brute-force token stuffing
const firebaseLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many Firebase login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Signup ─────────────────────────────────────────────────
router.post('/signup', async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: strongPassword,
      name: z.string().min(1).max(100),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    
    // Generate email verification token
    const { raw: verifyToken, hash: verifyHash, expiresAt: verifyExpires } = 
      await createExpiringToken(60 * 24); // 24 hours

    const user = await prisma.user.create({
      data: { 
        email: body.email, 
        name: body.name, 
        passwordHash,
        emailVerifyToken: verifyHash,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(body.email, verifyToken, body.name).catch(err => {
      logger.error('Failed to send verification email:', err.message);
    });

    const { accessToken, refreshToken } = setAuthCookies(res, user);
    
    // Store refresh token hash in DB
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: refreshHash } });

    res.json({ 
      token: accessToken, 
      user: sanitize(user),
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (e) { next(e); }
});

// ─── Login ──────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'No account found for this email. Please create an account first.' });
    }

    // Check account lockout
    if (isLocked(user)) {
      const remaining = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({ 
        error: `Account locked due to too many failed attempts. Try again in ${remaining} minutes.`,
        lockedUntil: user.lockedUntil,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Increment failed attempts
      const attempts = user.failedLoginAttempts + 1;
      const updateData = { failedLoginAttempts: attempts };

      // Lock account after MAX_FAILED_ATTEMPTS
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        logger.warn(`Account locked: ${email} after ${attempts} failed attempts`);
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });

      const remaining = MAX_FAILED_ATTEMPTS - attempts;
      if (remaining > 0) {
        return res.status(401).json({ error: `Incorrect password. ${remaining} attempts remaining before lockout.` });
      }
      // lockedUntil is always set when attempts >= MAX_FAILED_ATTEMPTS
      return res.status(423).json({ 
        error: `Account locked due to too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
        lockedUntil: updateData.lockedUntil,
      });
    }

    // Successful login — reset failed attempts
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const { accessToken, refreshToken } = setAuthCookies(res, user);

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        userAgent: ua.slice(0, 200),
        refreshToken: refreshHash,
      },
    });

    res.json({ token: accessToken, user: sanitize(user) });
  } catch (e) { next(e); }
});

// ─── Refresh Token ──────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, tokenVersion: true, role: true, refreshToken: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Verify the refresh token hash in DB (prevents reuse after rotation)
    const validRefresh = await bcrypt.compare(token, user.refreshToken || '');
    if (!validRefresh) {
      // Possible token reuse attack — invalidate all sessions
      await prisma.user.update({
        where: { id: user.id },
        data: { tokenVersion: { increment: 1 }, refreshToken: null },
      });
      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', refreshCookieOptions);
      return res.status(401).json({ error: 'Refresh token reuse detected. All sessions terminated.' });
    }

    // Rotate: issue new tokens, invalidate old refresh token
    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    const { accessToken, refreshToken: newRefresh } = setAuthCookies(res, fullUser);

    const newRefreshHash = await bcrypt.hash(newRefresh, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshHash },
    });

    res.json({ token: accessToken, user: sanitize(fullUser) });
  } catch (e) { next(e); }
});

// ─── Email Verification ─────────────────────────────────────
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.query);
    
    // Find user by token hash — we need to check all users since we store hashes
    const users = await prisma.user.findMany({
      where: { emailVerified: false, emailVerifyExpires: { gt: new Date() } },
      select: { id: true, emailVerifyToken: true, emailVerifyExpires: true },
    });

    let matchedUser = null;
    for (const u of users) {
      if (u.emailVerifyToken && await compareToken(token, u.emailVerifyToken)) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (e) { next(e); }
});

// ─── Resend Verification Email ──────────────────────────────
router.post('/resend-verification', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });
    if (!user.email) return res.status(400).json({ error: 'No email to verify' });

    const { raw: token, hash, expiresAt } = await createExpiringToken(60 * 24);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: hash, emailVerifyExpires: expiresAt },
    });

    await sendVerificationEmail(user.email, token, user.name);
    res.json({ message: 'Verification email sent' });
  } catch (e) { next(e); }
});

// ─── Forgot Password ────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.email) {
      const { raw: token, hash, expiresAt } = await createExpiringToken(60); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: hash, passwordResetExpires: expiresAt },
      });

      await sendPasswordResetEmail(user.email, token, user.name).catch(err => {
        logger.error('Failed to send password reset email:', err.message);
      });
    }

    // Always return same response — prevents email enumeration
    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (e) { next(e); }
});

// ─── Reset Password ─────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: strongPassword,
    }).parse(req.body);

    // Find user with valid reset token
    const users = await prisma.user.findMany({
      where: { passwordResetExpires: { gt: new Date() } },
      select: { id: true, passwordResetToken: true },
    });

    let matchedUser = null;
    for (const u of users) {
      if (u.passwordResetToken && await compareToken(token, u.passwordResetToken)) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Reset password + invalidate ALL sessions (increment tokenVersion)
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 },
        refreshToken: null, // Clear refresh token too
      },
    });

    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);
    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (e) { next(e); }
});

// ─── Firebase Exchange ──────────────────────────────────────
router.post('/firebase', firebaseLimiter, async (req, res, next) => {
  try {
    const { idToken } = z.object({ idToken: z.string() }).parse(req.body);
    const auth = firebaseAdmin.getAuth();
    if (!auth) return res.status(500).json({ error: 'Firebase is not configured on this server' });
    const decoded = await auth.verifyIdToken(idToken);

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    let linkedBy = null; // Track how the account was found (for audit)

    if (!user) {
      // SECURITY: Only link by email if the existing account's email is ALREADY verified.
      // This prevents account takeover: attacker signs up with victim's email (unverified),
      // then victim logs in via Firebase — the unverified account won't be auto-linked.
      if (decoded.email) {
        const emailMatch = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (emailMatch && emailMatch.emailVerified) {
          user = emailMatch;
          linkedBy = 'email';
        }
        // If email is NOT verified on existing account, do NOT link — create new account below
      }
      // SECURITY: Only link by phone if verified via Firebase (phone_number is always verified by Firebase)
      if (!user && decoded.phone_number) {
        const phoneMatch = await prisma.user.findUnique({ where: { phone: decoded.phone_number } });
        if (phoneMatch) {
          user = phoneMatch;
          linkedBy = 'phone';
        }
      }
    } else {
      linkedBy = 'firebaseUid';
    }

    if (user) {
      // SECURITY: If account already has a different Firebase UID, block the link
      // This prevents hijacking an account that's already linked to another Google account
      if (user.firebaseUid && user.firebaseUid !== decoded.uid) {
        logger.warn(`Firebase link blocked: user ${user.id} already linked to different Firebase UID`, {
          existingUid: user.firebaseUid,
          attemptedUid: decoded.uid,
          email: decoded.email,
          linkedBy,
        });
        return res.status(409).json({ error: 'This email is already associated with a different account. Please log in with your existing method.' });
      }

      // Link Firebase UID if not already linked
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: user.firebaseUid || decoded.uid,
          email: user.email || decoded.email || null,
          phone: user.phone || decoded.phone_number || null,
          name: user.name || decoded.name || decoded.email?.split('@')[0] || 'User',
          avatarUrl: user.avatarUrl || decoded.picture || null,
          emailVerified: user.emailVerified || !!decoded.email_verified,
        },
      });

      logger.info(`Firebase account linked: user ${user.id} via ${linkedBy}`, {
        userId: user.id,
        linkedBy,
        email: decoded.email,
      });
    } else {
      // Generate email verification token for new Firebase users
      const { raw: verifyToken, hash: verifyHash, expiresAt: verifyExpires } = 
        await createExpiringToken(60 * 24); // 24 hours

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || null,
          phone: decoded.phone_number || null,
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          avatarUrl: decoded.picture || null,
          emailVerified: !!decoded.email_verified,
          emailVerifyToken: verifyHash,
          emailVerifyExpires: verifyExpires,
        },
      });

      // Send verification email if email is not already verified (non-blocking)
      if (decoded.email && !decoded.email_verified) {
        sendVerificationEmail(decoded.email, verifyToken, user.name).catch(err => {
          logger.error('Failed to send Firebase user verification email:', err.message);
        });
      }
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';
    const { accessToken, refreshToken } = setAuthCookies(res, user);

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        userAgent: ua.slice(0, 200),
        refreshToken: refreshHash,
      },
    });

    res.json({ token: accessToken, user: sanitize(user) });
  } catch (e) { next(e); }
});

// ─── Logout ─────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    // Increment tokenVersion to invalidate ALL access tokens
    // Clear refresh token to prevent silent refresh
    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        tokenVersion: { increment: 1 },
        refreshToken: null,
      },
    });
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', refreshCookieOptions);
    res.json({ ok: true, message: 'Logged out successfully.' });
  } catch (e) { next(e); }
});

module.exports = router;
