/**
 * Admin access key — the second lock on every /api/admin route.
 *
 * In addition to the logged-in admin JWT, sensitive admin operations require a
 * separate secret key that is never stored in the database and only exists as
 * a SHA-256 hash in the environment (ADMIN_KEY_HASH). A leaked database dump
 * therefore cannot expose this key.
 *
 * Format expectations:
 *   ADMIN_KEY_HASH = sha256 hex of the raw key (lowercase, 64 chars)
 *   ADMIN_KEY_ID   = short public label of the key, e.g. "founder-2026-09"
 *
 * The raw key is held only by the humans who own the platform. Generate one:
 *   python -c "import secrets; print('rnt_'+secrets.token_urlsafe(30))"
 *   python -c "import hashlib;print(hashlib.sha256(b'THE_KEY').hexdigest())"
 *
 * Transport: the key may be sent as the `X-Admin-Key` header (server-to-server,
 * curl) or `adminKey` in the JSON body (the admin UI's unlock form). Both are
 * stripped from req before the route handler runs so the raw key never reaches
 * business logic or logs.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/** Extract the presented key from header or body, then scrub it from req. */
function extractPresentedKey(req) {
  const headerKey = req.headers?.['x-admin-key'];
  if (typeof headerKey === 'string' && headerKey.length) {
    delete req.headers['x-admin-key'];
    return headerKey;
  }

  if (req.body && typeof req.body === 'object' && typeof req.body.adminKey === 'string') {
    const { adminKey, ...rest } = req.body;
    // Keep the rest of the body intact for the route's own validation.
    req.body = rest;
    return adminKey;
  }

  return null;
}

/** True when the configured hash matches the SHA-256 of the presented key. */
function keyMatches(adminKeyHash, presentedKey) {
  const a = Buffer.from(String(adminKeyHash).toLowerCase(), 'hex');
  const b = crypto.createHash('sha256').update(String(presentedKey), 'utf8').digest();
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Require a valid admin key. Must run AFTER requireAuth + requireAdmin so
 * req.user is populated for audit logging.
 */
function requireAdminKey(req, res, next) {
  const adminKeyHash = process.env.ADMIN_KEY_HASH;

  // Fail closed: if no key is configured, admin routes stay locked.
  if (!adminKeyHash || !/^[0-9a-f]{64}$/i.test(adminKeyHash)) {
    logger.error('ADMIN_KEY_HASH is not configured — admin API is locked. Set it in the environment (sha256 hex of the key).');
    return res.status(503).json({
      error: 'Admin API is not configured. Contact the platform owner.',
      code: 'ADMIN_KEY_NOT_CONFIGURED',
    });
  }

  const presentedKey = extractPresentedKey(req);
  if (!presentedKey) {
    return res.status(401).json({
      error: 'Admin key required. Send it in the X-Admin-Key header.',
      code: 'ADMIN_KEY_REQUIRED',
    });
  }

  if (!keyMatches(adminKeyHash, presentedKey)) {
    logger.warn(`Admin key rejected for user ${req.user?.id || 'unknown'} from IP ${req.ip}`);
    return res.status(403).json({
      error: 'Invalid admin key',
      code: 'ADMIN_KEY_INVALID',
    });
  }

  // Stamp the audit trail: which key authorized this action.
  req.adminKeyId = process.env.ADMIN_KEY_ID || 'default';
  return next();
}

module.exports = { requireAdminKey };
