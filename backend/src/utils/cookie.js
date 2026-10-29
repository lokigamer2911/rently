const isProd = process.env.NODE_ENV === 'production';

// Access token cookie — short-lived, matches JWT 15min expiry
const cookieOptions = {
  httpOnly: true,      // Invisible to JavaScript, prevents XSS
  secure: isProd,      // Requires HTTPS in production
  sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-domain Vercel→Render
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

// Refresh token cookie — long-lived, used to silently refresh access tokens
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // Only sent to auth endpoints
};

module.exports = { cookieOptions, refreshCookieOptions };
