const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a cryptographically secure random token
 * Returns the raw token (sent to user) — hash before storing in DB
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token with bcrypt for secure storage
 * Use this before saving to DB — you can never reverse it
 */
async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

/**
 * Compare a raw token against a bcrypt hash
 * Returns true if the token matches the stored hash
 */
async function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}

/**
 * Create a time-limited token pair (raw + hash)
 * Returns { raw, hash, expiresAt }
 */
async function createExpiringToken(ttlMinutes = 60) {
  const raw = generateToken();
  const hash = await hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return { raw, hash, expiresAt };
}

module.exports = { generateToken, hashToken, compareToken, createExpiringToken };
