const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true, // Invisible to JavaScript, prevents XSS
  secure: isProd, // Requires HTTPS in production
  sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-domain API calls in production
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (matches JWT expiry)
};

module.exports = { cookieOptions };
