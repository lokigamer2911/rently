const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * requireAuth — Validates JWT and verifies the token version matches the DB.
 * If the user has logged out (tokenVersion incremented), their old tokens
 * are immediately rejected even if they haven't expired yet.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Server-side revocation check: fetch user's current tokenVersion
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, tokenVersion: true, role: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    // If the stored version is greater than the token's version, this token
    // was issued before the last logout and must be rejected.
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // Attach full decoded payload + confirmed role to request
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
