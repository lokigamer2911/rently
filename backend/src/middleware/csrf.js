const crypto = require('crypto');

/**
 * CSRF Protection — Double Submit Cookie Pattern
 *
 * How it works:
 * 1. On first request (GET /api/auth/csrf-token), server generates a random token
 *    and sets it as a readable (non-httpOnly) cookie
 * 2. On subsequent state-changing requests (POST/PATCH/DELETE), the frontend reads
 *    the cookie and sends it as a header: X-CSRF-Token
 * 3. Server compares the cookie value with the header value
 *
 * Why this works for cross-origin (Vercel→Render):
 * - CORS blocks cross-origin requests from reading response headers/cookies
 * - Only the SAME origin (Vercel frontend) can read the csrf-token cookie
 * - An attacker's site can't read the cookie value, so they can't set the header
 */

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

// Methods that need CSRF protection (state-changing)
const UNSAFE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

// Paths that are exempt from CSRF (public webhooks, health checks, etc.)
const EXEMPT_PATHS = [
  '/api/payments/webhook',    // Razorpay webhook (verified by HMAC)
  '/api/auth/login',          // Login doesn't need CSRF (no existing session)
  '/api/auth/signup',         // Signup doesn't need CSRF (no existing session)
  '/api/auth/firebase',       // Firebase exchange (no existing session)
  '/api/auth/refresh',        // Refresh token rotation — cookie-only auth is sufficient
  '/api/auth/forgot-password', // Password reset request (no session needed)
  '/api/auth/reset-password',  // Password reset (no session needed)
  '/api/auth/verify-email',    // Email verification (no session needed)
  '/api/auth/csrf-token',      // Token endpoint itself
  '/health',                   // Health check
];

function isExempt(path) {
  return EXEMPT_PATHS.some(exempt => path.startsWith(exempt));
}

/**
 * Generate a CSRF token and set it as a readable cookie
 */
function generateCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,    // MUST be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  return token;
}

/**
 * CSRF token endpoint — GET /api/auth/csrf-token
 */
function csrfTokenEndpoint(req, res) {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
}

/**
 * CSRF validation middleware
 */
function csrfProtection(req, res, next) {
  // Skip safe methods (GET, HEAD, OPTIONS)
  if (!UNSAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Skip exempt paths
  if (isExempt(req.path)) {
    return next();
  }

  // In development, skip CSRF to simplify testing
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER.toLowerCase()];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: 'CSRF token missing. Please refresh the page.' });
  }

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'CSRF token invalid. Please refresh the page.' });
  }

  next();
}

module.exports = { csrfProtection, csrfTokenEndpoint, generateCsrfToken };
