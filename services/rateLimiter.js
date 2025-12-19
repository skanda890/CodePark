/**
 * Rate Limiter Service - Fixed Version
 * Implements distributed rate limiting using Redis
 * Supports sliding window and token bucket algorithms
 */

const Redis = require('ioredis')
const logger = require('./logger')

class RateLimiter {
  constructor (options = {}) {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: true
      })

      this.redis.on('error', (err) => {
        logger.error('Redis connection error in RateLimiter', {
          error: err.message
        })
      })

      this.defaultWindowMs = options.windowMs || 60000
      this.defaultMaxRequests = options.maxRequests || 100
      this.keyPrefix = options.keyPrefix || 'ratelimit:'
      this.skipSuccessfulRequests = options.skipSuccessfulRequests || false
      this.skipFailedRequests = options.skipFailedRequests || false
    } catch (error) {
      logger.error('RateLimiter initialization failed', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Check if request is within rate limit (sliding window)
   */
  async checkLimit (key, options = {}) {
    if (!key || typeof key !== 'string') {
      logger.warn('Invalid key provided to checkLimit', { key: typeof key })
      return { allowed: false, error: 'Invalid key' }
    }

    const windowMs = options.windowMs || this.defaultWindowMs
    const maxRequests = options.maxRequests || this.defaultMaxRequests
    const fullKey = `${this.keyPrefix}${key}`

    try {
      const now = Date.now()
      const windowStart = now - windowMs

      // Remove old entries outside the window
      await this.redis.zremrangebyscore(fullKey, '-inf', windowStart)

      // Count requests in current window
      const requestId = `${now}-${Math.random().toString(36).substr(2, 9)}`;

      // Use a Lua script to perform cleanup, count, and conditional insert atomically
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local maxReq = tonumber(ARGV[3])
        local member = ARGV[4]

        local windowStart = now - window
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
        local count = redis.call('ZCARD', key)

        if count >= maxReq then
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local oldestScore
          if oldest[2] ~= nil then
            oldestScore = tonumber(oldest[2])
          else
            oldestScore = now
          end
          return {0, count, oldestScore + window}
        end

        redis.call('ZADD', key, now, member)
        redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)
        return {1, count + 1, now + window}
      `;

      const result = await this.redis.eval(
        script,
        1,
        fullKey,
        now.toString(),
        windowMs.toString(),
        maxRequests.toString(),
        requestId
      );

      const allowed = result[0] === 1;
      const current = result[1];
      const resetTime = result[2];

      if (!allowed) {
        return {
          allowed: false,
          limit: maxRequests,
          current,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }

      return {
        allowed: true,
        limit: maxRequests,
        current,
        resetTime,
        remaining: Math.max(0, maxRequests - current)
      }
    } catch (error) {
      logger.error('Rate limiter check failed', { key, error: error.message })
      // Fail open - allow request if Redis is down
      return { allowed: true, warning: 'Rate limiter unavailable' }
    }
  }

  /**
   * Token bucket algorithm for more granular control
   */
  async checkTokenBucket (key, options = {}) {
    if (!key || typeof key !== 'string') {
      logger.warn('Invalid key provided to checkTokenBucket', {
        key: typeof key
      })
      return { allowed: false, error: 'Invalid key' }
    }

    const capacity = options.capacity || 100
    const refillRate = options.refillRate || 10
    const tokensPerRequest = Math.max(1, options.tokensPerRequest || 1)
    const fullKey = `${this.keyPrefix}bucket:${key}`

    try {
      const now = Date.now()
      const bucketData = await this.redis.hgetall(fullKey)

      let tokens = bucketData.tokens ? parseFloat(bucketData.tokens) : capacity
      let lastRefill = bucketData.lastRefill
        ? parseInt(bucketData.lastRefill, 10)
        : now

      // Validate parsed values
      if (isNaN(tokens)) tokens = capacity
      if (isNaN(lastRefill)) lastRefill = now

      // Calculate elapsed time and add tokens
      const elapsed = Math.max(0, (now - lastRefill) / 1000)
      tokens = Math.min(capacity, tokens + elapsed * refillRate)

      if (tokens >= tokensPerRequest) {
        tokens -= tokensPerRequest
        await this.redis.hset(
          fullKey,
          'tokens',
          tokens.toString(),
          'lastRefill',
          now.toString()
        )
        await this.redis.expire(
          fullKey,
          Math.ceil((capacity / Math.max(1, refillRate)) * 1.5)
        )

        return {
          allowed: true,
          tokensRemaining: Math.floor(tokens),
          tokensCapacity: capacity,
          refillRate
        }
      }

      const timeToWait = Math.max(
        0,
        (tokensPerRequest - tokens) / Math.max(1, refillRate)
      )
      return {
        allowed: false,
        tokensRemaining: Math.floor(tokens),
        tokensCapacity: capacity,
        refillRate,
        retryAfter: Math.ceil(timeToWait)
      }
    } catch (error) {
      logger.error('Token bucket check failed', { key, error: error.message })
      return { allowed: true, warning: 'Token bucket unavailable' }
    }
  }

  /**
   * Reset rate limit for a key
   */
  async reset (key) {
    if (!key || typeof key !== 'string') {
      logger.warn('Invalid key provided to reset', { key: typeof key })
      return { success: false, error: 'Invalid key' }
    }

    try {
      const fullKey = `${this.keyPrefix}${key}`
      await this.redis.del(fullKey)
      return { success: true, key }
    } catch (error) {
      logger.error('Reset failed', { key, error: error.message })
      return { success: false, error: error.message }
    }
  }

  /**
   * Get current rate limit status
   */
  async getStatus (key, options = {}) {
    if (!key || typeof key !== 'string') {
      logger.warn('Invalid key provided to getStatus', { key: typeof key })
      return { key, error: 'Invalid key' }
    }

    const windowMs = options.windowMs || this.defaultWindowMs
    const maxRequests = options.maxRequests || this.defaultMaxRequests
    const fullKey = `${this.keyPrefix}${key}`

    try {
      const now = Date.now()
      const windowStart = now - windowMs
      await this.redis.zremrangebyscore(fullKey, '-inf', windowStart)
      const requestCount = await this.redis.zcard(fullKey)
      const ttl = await this.redis.pttl(fullKey)

      return {
        key,
        requests: requestCount,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - requestCount),
        resetTime: ttl > 0 ? new Date(now + ttl).toISOString() : null,
        ttlMs: Math.max(0, ttl)
      }
    } catch (error) {
      logger.error('Get status failed', { key, error: error.message })
      return { key, error: error.message }
    }
  }

  /**
   * Cleanup and close Redis connection
   */
  async close () {
    try {
      await this.redis.quit()
      logger.info('RateLimiter Redis connection closed')
    } catch (error) {
      logger.error('Error closing RateLimiter Redis connection', {
        error: error.message
      })
    }
  }
}

module.exports = RateLimiter
