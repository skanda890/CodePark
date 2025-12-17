/**
 * Rate Limiter Service
 * Implements distributed rate limiting using Redis
 * Supports sliding window and token bucket algorithms
 */

const Redis = require('ioredis');
const logger = require('./logger');

class RateLimiter {
  constructor(options = {}) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null
    });

    this.defaultWindowMs = options.windowMs || 60000; // 1 minute
    this.defaultMaxRequests = options.maxRequests || 100;
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
  }

  /**
   * Check if request is within rate limit (sliding window)
   */
  async checkLimit(key, options = {}) {
    const windowMs = options.windowMs || this.defaultWindowMs;
    const maxRequests = options.maxRequests || this.defaultMaxRequests;
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries outside the window
      await this.redis.zremrangebyscore(fullKey, '-inf', windowStart);

      // Count requests in current window
      const requestCount = await this.redis.zcard(fullKey);

      if (requestCount >= maxRequests) {
        const oldestRequest = await this.redis.zrange(fullKey, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest[1] ? parseInt(oldestRequest[1]) + windowMs : now + windowMs;

        return {
          allowed: false,
          limit: maxRequests,
          current: requestCount,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }

      // Add current request
      await this.redis.zadd(fullKey, now, `${now}-${Math.random()}`);
      await this.redis.expire(fullKey, Math.ceil(windowMs / 1000) + 1);

      return {
        allowed: true,
        limit: maxRequests,
        current: requestCount + 1,
        resetTime: now + windowMs,
        remaining: maxRequests - (requestCount + 1)
      };
    } catch (error) {
      logger.error('Rate limiter check failed', { key, error: error.message });
      // Fail open - allow request if Redis is down
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Token bucket algorithm for more granular control
   */
  async checkTokenBucket(key, options = {}) {
    const capacity = options.capacity || 100;
    const refillRate = options.refillRate || 10; // tokens per second
    const tokensPerRequest = options.tokensPerRequest || 1;
    const fullKey = `${this.keyPrefix}bucket:${key}`;

    try {
      const now = Date.now();
      const bucketData = await this.redis.hgetall(fullKey);

      let tokens = bucketData.tokens ? parseFloat(bucketData.tokens) : capacity;
      let lastRefill = bucketData.lastRefill ? parseInt(bucketData.lastRefill) : now;

      // Calculate elapsed time and add tokens
      const elapsed = (now - lastRefill) / 1000;
      tokens = Math.min(capacity, tokens + elapsed * refillRate);

      if (tokens >= tokensPerRequest) {
        tokens -= tokensPerRequest;
        await this.redis.hset(fullKey, 'tokens', tokens.toString(), 'lastRefill', now.toString());
        await this.redis.expire(fullKey, Math.ceil((capacity / refillRate) * 1.5));

        return {
          allowed: true,
          tokensRemaining: Math.floor(tokens),
          tokensCapacity: capacity
        };
      }

      const timeToWait = (tokensPerRequest - tokens) / refillRate;
      return {
        allowed: false,
        tokensRemaining: Math.floor(tokens),
        tokensCapacity: capacity,
        retryAfter: Math.ceil(timeToWait * 1000)
      };
    } catch (error) {
      logger.error('Token bucket check failed', { key, error: error.message });
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key) {
    const fullKey = `${this.keyPrefix}${key}`;
    await this.redis.del(fullKey);
    return { success: true, key };
  }

  /**
   * Get current rate limit status
   */
  async getStatus(key, options = {}) {
    const windowMs = options.windowMs || this.defaultWindowMs;
    const maxRequests = options.maxRequests || this.defaultMaxRequests;
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      await this.redis.zremrangebyscore(fullKey, '-inf', windowStart);
      const requestCount = await this.redis.zcard(fullKey);
      const ttl = await this.redis.pttl(fullKey);

      return {
        key,
        requests: requestCount,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - requestCount),
        reset: ttl > 0 ? new Date(now + ttl) : null
      };
    } catch (error) {
      logger.error('Get status failed', { key, error: error.message });
      return { key, error: error.message };
    }
  }

  /**
   * Cleanup and close Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}

module.exports = RateLimiter;
