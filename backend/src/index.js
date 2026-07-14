// backend/src/index.js
const { app, registerSocket, allowedOrigins } = require('./app');
const http = require('http');
const { Server } = require('socket.io');

// Create HTTP server from Express app
const server = http.createServer(app);

// Register Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
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
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

listen();
