/**
 * Redis Cache Utility
 * 
 * Provides caching for frequently accessed data to improve API response times.
 * 
 * Usage:
 *   const cache = require('./cache');
 *   const data = await cache.get('key', () => fetchFromDB());
 *   await cache.set('key', data, ttlMinutes);
 * 
 * Benefits:
 * - Reduces database load for read-heavy operations
 * - Improves API response times (milliseconds vs seconds)
 * - Can be disabled in development by not setting REDIS_URL
 */

const redis = require('ioredis');

// Create Redis client - disabled if no URL provided
let client;

try {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    client = new redis(redisUrl);
    client.on('connect', () => {
      console.log('✅ Redis connected');
    });
    client.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      // Don't crash - continue without cache if Redis fails
      client = null;
    });
  } else {
    console.log('ℹ️ REDIS_URL not set — caching disabled (development mode)');
  }
} catch (err) {
  console.warn('⚠️ Redis initialization failed:', err.message);
  client = null;
}

/**
 * Get value from cache, or execute fallback function if missing/expired
 */
async function get(key, fallback, ttlMinutes = 10) {
  if (!client) {
    // Fallback: execute function directly if Redis not available
    const result = await fallback();
    return result;
  }

  try {
    const cached = await client.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }

    // Key not found — execute fallback and cache result
    const result = await fallback();
    await client.set(key, JSON.stringify(result), 'EX', ttlMinutes * 60);
    return result;
  } catch (err) {
    console.warn(`⚠️ Cache get failed for key "${key}":`, err.message);
    // Fallback: execute function directly
    return await fallback();
  }
}

/**
 * Set value in cache with TTL
 */
async function set(key, value, ttlMinutes = 10) {
  if (!client) {
    console.log('ℹ️ Cache set skipped — Redis not available');
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlMinutes * 60);
  } catch (err) {
    console.warn(`⚠️ Cache set failed for key "${key}":`, err.message);
  }
}

/**
 * Check if key exists in cache
 */
async function has(key) {
  if (!client) return false;
  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (err) {
    console.warn(`⚠️ Cache has failed for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Delete key from cache
 */
async function del(key) {
  if (!client) return false;
  try {
    const result = await client.del(key);
    return result === 1;
  } catch (err) {
    console.warn(`⚠️ Cache del failed for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Flush entire cache (use with caution!)
 */
async function flush() {
  if (!client) return false;
  try {
    await client.flushall();
    return true;
  } catch (err) {
    console.error('❌ Cache flush failed:', err.message);
    return false;
  }
}

module.exports = {
  get,
  set,
  has,
  del,
  flush,
  client,
};