/**
 * Cache Service
 * Redis-based caching with in-memory fallback
 */

const Redis = require('ioredis');
const config = require('../config');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.memoryCache = new Map();
  }

  /**
   * Connect to Redis
   */
  async connect() {
    if (!config.redis.enabled) {
      logger.info('Redis disabled, using in-memory cache');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 1000);
        }
      });

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('Redis connected');
      });

      this.client.on('error', (err) => {
        logger.error({ err }, 'Redis error');
        this.connected = false;
      });

      await this.client.ping();
    } catch (error) {
      logger.warn({ err: error }, 'Redis connection failed, using in-memory fallback');
      this.client = null;
      this.connected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value
   */
  async get(key) {
    try {
      if (this.connected && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }
      return null;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = config.cache.ttl) {
    try {
      if (this.connected && this.client) {
        await this.client.setex(key, ttl, JSON.stringify(value));
        return;
      }

      // Fallback to memory cache
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + ttl * 1000
      });

      // Clean up expired entries
      this.cleanupMemoryCache();
    } catch (error) {
      logger.error({ err: error, key }, 'Cache set error');
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    try {
      if (this.connected && this.client) {
        await this.client.del(key);
        return;
      }

      this.memoryCache.delete(key);
    } catch (error) {
      logger.error({ err: error, key }, 'Cache delete error');
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    try {
      if (this.connected && this.client) {
        await this.client.flushdb();
        return;
      }

      this.memoryCache.clear();
    } catch (error) {
      logger.error({ err: error }, 'Cache flush error');
    }
  }

  /**
   * Clean up expired memory cache entries
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, data] of this.memoryCache.entries()) {
      if (data.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Check if cache is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.connected || this.memoryCache.size >= 0;
  }
}

module.exports = new CacheService();
