const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (ACCESS_SECRET + '_refresh');

/**
 * Sign a short-lived access token (15 minutes)
 */
exports.signAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: (user.name || '').slice(0, 50), // Sanitize: max 50 chars, prevent injection
      tokenVersion: user.tokenVersion ?? 0,
      type: 'access',
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

/**
 * Sign a long-lived refresh token (7 days)
 * Stored as httpOnly cookie and hashed in DB
 */
exports.signRefreshToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion ?? 0,
      type: 'refresh',
    },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

/**
 * Verify an access token
 */
exports.verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);

/**
 * Verify a refresh token
 */
exports.verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

/**
 * Legacy: signToken for backward compat (used in Firebase flow)
 */
exports.signToken = (user) => exports.signAccessToken(user);
