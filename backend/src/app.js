// backend/src/app.js
require('dotenv').config(); // Reload env config
const logger = require('./utils/logger');

// SECURITY: Removed automatic 'prisma db push --accept-data-loss' on production startup.
// That command silently drops columns/data on schema drift — catastrophic for production.
// Use 'prisma migrate deploy' in your CI/CD pipeline instead.

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const listingRoutes = require('./routes/listing.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes');
const reviewRoutes = require('./routes/review.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const disputeRoutes = require('./routes/dispute.routes');

const { registerSocket } = require('./sockets');

const { csrfProtection, csrfTokenEndpoint } = require('./middleware/csrf');

const app = express();

// Security headers with CORS-friendly configuration
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// Tiered Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'AI suggestion limit reached, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [
  clientUrl,
  'https://rently-chi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

// SECURITY: Only allow our specific Vercel subdomain, NOT any *.vercel.app
// (Anyone can deploy to Vercel — wildcard allows credential theft from attacker sites)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Razorpay webhook needs raw body — mount before json parser
app.use(
  '/api/payments/webhook',
  express.raw({
    type: 'application/json',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// CSRF protection (production only, state-changing methods)
app.use(csrfProtection);

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/listings/ai-suggest', aiLimiter);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled Server Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Server error'),
  });
});

module.exports = { app, registerSocket, allowedOrigins };
