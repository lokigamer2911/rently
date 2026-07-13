const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');

function registerSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
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
        const message = await prisma.message.create({
          data: {
            threadId,
            senderId: socket.user.id,
            content
          },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } }
        });

        const thread = await prisma.thread.findUnique({ where: { id: threadId } });
        const targetId = thread.userAId === socket.user.id ? thread.userBId : thread.userAId;

        io.to(`user:${targetId}`).emit('message:recv', message);
        io.to(`user:${socket.user.id}`).emit('message:recv', message);
        
        // Notify the receiver (triggers Email/SMS via createNotification)
        const { createNotification } = require('../utils/notifications');
        await createNotification(io, {
          userId: targetId,
          type: 'NEW_MESSAGE',
          title: `New message from ${socket.user.name || 'someone'} 💬`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
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
