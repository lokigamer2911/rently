const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const ACCESS_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

/**
 * requireAuth — Validates JWT and verifies the token version matches the DB.
 * 
 * SECURITY: In production, ONLY accepts httpOnly cookie auth.
 * Bearer token fallback is disabled to prevent token theft via XSS.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  
  // In production: cookie only (prevents XSS token theft)
  // In development: allow Bearer fallback for testing tools
  let token;
  if (isProd) {
    token = req.cookies?.token || null;
  } else {
    token = req.cookies?.token || (header.startsWith('Bearer ') ? header.slice(7) : null);
  }

  if (!token) return res.status(401).json({ error: 'Missing token' });

  let decoded;
  try {
    decoded = jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Verify token type is access (not refresh)
  if (decoded.type && decoded.type !== 'access') {
    return res.status(401).json({ error: 'Invalid token type' });
  }

  // Server-side revocation check: fetch user's current tokenVersion
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, tokenVersion: true, role: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (e) {
    next(e);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin };
