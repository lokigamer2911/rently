const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');

function registerSocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // SECURITY: Verify token version matches DB (same as HTTP auth middleware)
      // Otherwise logged-out users keep their socket connections alive
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, tokenVersion: true },
      });
      if (!user) return next(new Error('User not found'));
      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(new Error('Session expired'));
      }
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('message:send', async (data, callback) => {
      try {
        const { threadId, content } = data;

        // Validate content: must be a non-empty string under 2000 chars
        if (!content || typeof content !== 'string' || !content.trim()) {
          return callback?.({ ok: false, error: 'Message content is required' });
        }
        const trimmedContent = content.trim().slice(0, 2000);

        if (!threadId || typeof threadId !== 'string') {
          return callback?.({ ok: false, error: 'Invalid thread ID' });
        }

        const thread = await prisma.thread.findUnique({ where: { id: threadId } });
        if (!thread) {
          return callback?.({ ok: false, error: 'Thread not found' });
        }

        if (thread.userAId !== socket.user.id && thread.userBId !== socket.user.id) {
          return callback?.({ ok: false, error: 'Forbidden' });
        }

        const message = await prisma.message.create({
          data: {
            threadId,
            senderId: socket.user.id,
            content: trimmedContent
          },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } }
        });

        const targetId = thread.userAId === socket.user.id ? thread.userBId : thread.userAId;

        io.to(`user:${targetId}`).emit('message:recv', message);
        io.to(`user:${socket.user.id}`).emit('message:recv', message);
        
        // Notify the receiver (triggers Email/SMS via createNotification)
        const { createNotification } = require('../utils/notifications');
        await createNotification(io, {
          userId: targetId,
          type: 'NEW_MESSAGE',
          title: `New message from ${socket.user.name || 'someone'} 💬`,
          body: trimmedContent.length > 50 ? trimmedContent.substring(0, 47) + '...' : trimmedContent,
          link: `/chat/${threadId}`
        });

        if (callback) callback({ ok: true, message });
      } catch (e) {
        if (callback) callback({ ok: false, error: e.message });
      }
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { registerSocket };
