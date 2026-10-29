const { PrismaClient } = require('@prisma/client');

const createPrismaClient = () => {
  try {
    return new PrismaClient({
      // Neon.tech connection pooling settings
      // Prevents "too many connections" errors on Neon's free tier (limit: ~20)
      datasources: {
        db: {
          // Neon provides its own pooling via pgbouncer
          // Append ?pgbouncer=true if using Neon's pooled connection string
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'production'
        ? ['error']  // Production: only log errors
        : ['query', 'error', 'warn'],  // Dev: full logging
    });
  } catch (error) {
    console.error('Failed to create PrismaClient:', error);
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

// Singleton pattern: prevent multiple PrismaClient instances in development
// (Hot reload creates new instances without this, exhausting connections)
const prisma = global.__prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
