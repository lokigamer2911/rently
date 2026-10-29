// backend/src/index.js
const { app, registerSocket, allowedOrigins } = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { cleanupStalePendingBookings } = require('./utils/bookingCleanup');

// Create HTTP server from Express app
const server = http.createServer(app);

// Register Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
app.set('io', io);
registerSocket(io);

// Port handling with retry on EADDRINUSE
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
    console.error(`Ports ${startPort}-${currentPort} are in use. Set PORT to a free value.`);
    try {
      if (server && server.listening) {
        server.close(() => process.exit(1));
        setTimeout(() => process.exit(1), 5000);
      } else {
        process.exit(1);
      }
    } catch (e) {
      console.error('Failed to shutdown server gracefully:', e);
      process.exit(1);
    }
    return;
  }
  console.error('Server error:', err);
  try {
    if (server && server.listening) {
      server.close(() => process.exit(1));
      setTimeout(() => process.exit(1), 5000);
    } else {
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to shutdown server gracefully:', e);
    process.exit(1);
  }
});

const scheduleCleanup = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set — skipping scheduled booking cleanup.');
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    console.log('NODE_ENV=test — skipping scheduled booking cleanup.');
    return;
  }

  const prisma = require('./config/prisma');
  setInterval(async () => {
    try {
      await cleanupStalePendingBookings({ prisma });
    } catch (error) {
      console.error('Stale pending booking cleanup failed:', error);
    }
  }, 5 * 60 * 1000);
};

if (require.main === module) {
  listen();
  scheduleCleanup();
}

module.exports = app;
