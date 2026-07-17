const { PrismaClient } = require('@prisma/client');

const createPrismaClient = () => {
  try {
    return new PrismaClient();
  } catch (error) {
    return {
      $transaction: async () => { throw error; },
      payment: { findUnique: async () => null, update: async () => null, updateMany: async () => null, create: async () => null },
      booking: { findUnique: async () => null, update: async () => null },
      listing: { update: async () => null },
      user: { findUnique: async () => null },
      notification: { create: async () => null },
      alert: { findMany: async () => [], delete: async () => null },
    };
  }
};

const prisma = global.__prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;
module.exports = prisma;
