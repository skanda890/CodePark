const Redis = require('ioredis');

/**
 * Centralized Redis Client
 * Used across application for caching, rate limiting, and pub/sub
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect on READONLY errors
      return true;
    }
    return false;
  },
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

redis.on('ready', () => {
  console.log('[Redis] Redis client ready');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.warn('[Redis] Connection closed');
});

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Redis] Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Redis] Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

module.exports = redis;
