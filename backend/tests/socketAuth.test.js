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

const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_sockets';

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
      // Capture the auth middleware so the test can await it like a real handshake.
      use: jest.fn((middleware) => { io._middleware = middleware; }),
      on: jest.fn((event, handler) => {
        connectionHandlers[event] = handler;
      }),
      to: jest.fn(() => ({ emit: jest.fn() })),
      _middleware: null,
      _authenticatedSocket: null,
    };

    const socket = {
      handshake: { headers: {}, auth: {} },
      user: null,
      join: jest.fn(),
      on: jest.fn((event, handler) => {
        socketHandlers[event] = handler;
      }),
    };

    registerSocket(io);

    // Intruder authenticates with a valid token but is not in the thread.
    const intruderToken = jwt.sign(
      { id: 'user_c', tokenVersion: 0 },
      process.env.JWT_SECRET,
    );
    socket.handshake.auth.token = intruderToken;
    await io._middleware(socket, (err) => {
      if (!err) io._authenticatedSocket = socket;
    });

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
