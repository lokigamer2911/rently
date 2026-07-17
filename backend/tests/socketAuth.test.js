jest.mock('../src/config/prisma', () => ({
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
    prisma.message.create.mockResolvedValue({ id: 'msg_1' });
    prisma.thread.findUnique.mockResolvedValue({ id: 'thread_1', userAId: 'user_a', userBId: 'user_b' });

    const connectionHandlers = {};
    const socketHandlers = {};

    const io = {
      use: jest.fn(),
      on: jest.fn((event, handler) => {
        connectionHandlers[event] = handler;
      }),
      to: jest.fn(() => ({ emit: jest.fn() })),
    };

    const socket = {
      user: { id: 'user_c', name: 'Intruder' },
      join: jest.fn(),
      on: jest.fn((event, handler) => {
        socketHandlers[event] = handler;
      }),
    };

    registerSocket(io);
    connectionHandlers.connection(socket);

    const callback = jest.fn();
    await socketHandlers['message:send']({ threadId: 'thread_1', content: 'hello' }, callback);

    expect(prisma.thread.findUnique).toHaveBeenCalledWith({ where: { id: 'thread_1' } });
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith({ ok: false, error: 'Forbidden' });
  });
});
