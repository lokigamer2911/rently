require('dotenv').config(); // Reload env config

// Automatically sync database schema on startup in production/Render environments
if (process.env.DATABASE_URL) {
  try {
    const { execSync } = require('child_process');
    console.log('Production startup: Syncing database schema with prisma db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Prisma db push completed successfully.');
  } catch (error) {
    console.error('Error during database schema sync (prisma db push):', error);
  }
}

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

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

const app = express();

// Security headers with CORS-friendly configuration
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Tiered Rate Limiting
// General API: 200 req / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints: 10 req / 15 min per IP — brute force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// AI Suggest: 20 req / 15 min per IP
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'AI suggestion limit reached, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);

const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [
  clientUrl,
  'https://rently-chi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or is a vercel subdomain
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true,
}));

// Razorpay webhook needs raw body — mount before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/listings/ai-suggest', aiLimiter); // Extra throttle on AI endpoint
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });
registerSocket(io);
app.set('io', io);

const startPort = Number(process.env.PORT || 5050);
let currentPort = startPort;
let portAttempts = 0;
const maxPortRetries = 10;

const listen = () => {
  server.listen(currentPort, () => console.log(`API + WS on :${currentPort}`));
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && portAttempts < maxPortRetries) {
    console.warn(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
    portAttempts += 1;
    currentPort += 1;
    setTimeout(listen, 100);
    return;
  }

  if (err.code === 'EADDRINUSE') {
    console.error(
      `Ports ${startPort}-${currentPort} are in use. Please stop the process using one of them or set PORT to a free value.`
    );
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});

listen();
