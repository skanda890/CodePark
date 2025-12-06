/**
 * Cache Middleware - Redis-based response caching
 * Implements intelligent caching for API responses
 */

const redis = require('redis');

class CacheMiddleware {
  constructor(options = {}) {
    this.options = {
      defaultTTL: options.defaultTTL || 300, // 5 minutes
      prefix: options.prefix || 'cache:',
      redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      ...options
    };

    this.client = null;
    this.connected = false;
  }

  /**
   * Connect to Redis
   */
  async connect() {
    if (this.connected) return;

    this.client = redis.createClient({
      url: this.options.redisUrl
    });

    this.client.on('error', (err) => {
      console.error('[CacheMiddleware] Redis error:', err);
    });

    this.client.on('connect', () => {
      console.log('[CacheMiddleware] Connected to Redis');
      this.connected = true;
    });

    await this.client.connect();
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  /**
   * Get cache middleware function
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Function} Express middleware
   */
  middleware(ttl = null) {
    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip if not connected to Redis
      if (!this.connected) {
        console.warn('[CacheMiddleware] Redis not connected, skipping cache');
        return next();
      }

      const key = this._generateKey(req);

      try {
        // Try to get cached response
        const cached = await this.client.get(key);
        
        if (cached) {
          const data = JSON.parse(cached);
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', key);
          return res.json(data);
        }

        // Cache miss - intercept response
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', key);

        const originalJson = res.json.bind(res);

        res.json = (data) => {
          // Only cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const cacheTTL = ttl || this.options.defaultTTL;
            this.client.setEx(
              key, 
              cacheTTL, 
              JSON.stringify(data)
            ).catch(err => {
              console.error('[CacheMiddleware] Cache set error:', err);
            });
          }

          return originalJson(data);
        };

        next();
      } catch (error) {
        console.error('[CacheMiddleware] Cache error:', error);
        next();
      }
    };
  }

  /**
   * Invalidate cache by key pattern
   * @param {string} pattern - Redis key pattern
   */
  async invalidate(pattern) {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(`${this.options.prefix}${pattern}`);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`[CacheMiddleware] Invalidated ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error('[CacheMiddleware] Invalidation error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(`${this.options.prefix}*`);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`[CacheMiddleware] Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error('[CacheMiddleware] Clear error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    if (!this.connected) {
      return { connected: false };
    }

    try {
      const keys = await this.client.keys(`${this.options.prefix}*`);
      const info = await this.client.info('stats');

      return {
        connected: true,
        keyCount: keys.length,
        info: this._parseInfo(info)
      };
    } catch (error) {
      console.error('[CacheMiddleware] Stats error:', error);
      return { error: error.message };
    }
  }

  /**
   * Private: Generate cache key from request
   */
  _generateKey(req) {
    const baseKey = `${req.method}:${req.path}`;
    const queryString = Object.keys(req.query).length > 0 
      ? ':' + JSON.stringify(req.query)
      : '';
    return `${this.options.prefix}${baseKey}${queryString}`;
  }

  /**
   * Private: Parse Redis INFO output
   */
  _parseInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    }

    return stats;
  }
}

module.exports = CacheMiddleware;
