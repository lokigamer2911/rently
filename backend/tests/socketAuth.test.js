// Mock prisma with all methods used by sockets
jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  message: {
    create: jest.fn(),
  },
  thread: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../src/config/prisma');
const { registerSocket } = require('../src/sockets');

describe('socket message authorization', () => {
  it('rejects messages from users who are not part of the thread', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user_c', tokenVersion: 0 });
    prisma.message.create.mockResolvedValue({ id: 'msg_1' });
    prisma.thread.findUnique.mockResolvedValue({ id: 'thread_1', userAId: 'user_a', userBId: 'user_b' });

    const connectionHandlers = {};
    const socketHandlers = {};

    const io = {
      use: jest.fn((middleware) => {
        // Simulate successful middleware (user is authenticated)
        const fakeSocket = { user: { id: 'user_c', name: 'Intruder', tokenVersion: 0 } };
        middleware(fakeSocket, (err) => {
          if (!err) {
            // Store the authenticated socket
            io._authenticatedSocket = fakeSocket;
          }
        });
      }),
      on: jest.fn((event, handler) => {
        connectionHandlers[event] = handler;
      }),
      to: jest.fn(() => ({ emit: jest.fn() })),
      _authenticatedSocket: null,
    };

    const socket = {
      handshake: { auth: { token: 'valid-token' } },
      user: null,
      join: jest.fn(),
      on: jest.fn((event, handler) => {
        socketHandlers[event] = handler;
      }),
    };

    registerSocket(io);

    // Simulate connection with the authenticated socket
    const authSocket = io._authenticatedSocket || socket;
    connectionHandlers.connection(authSocket);

    const callback = jest.fn();
    await socketHandlers['message:send']({ threadId: 'thread_1', content: 'hello' }, callback);

    expect(prisma.thread.findUnique).toHaveBeenCalledWith({ where: { id: 'thread_1' } });
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Forbidden' });
  });
});
