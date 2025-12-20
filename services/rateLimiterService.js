/**
 * Rate Limiter Service - Refactored & Fixed
 * Centralized validation, separated algorithms, normalized responses
 * Fixes: Full reset of both sliding-window and token-bucket keys
 */

const Redis = require('ioredis')
const logger = require('./logger')

class RateLimiter {
  constructor (options = {}) {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
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
    } catch (error) {
      logger.error('RateLimiter initialization failed', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Validate key and return normalized result
   * Centralizes key validation logic
   */
  _validateKey (key, methodName) {
    if (!key || typeof key !== 'string') {
      logger.warn(`Invalid key provided to ${methodName}`, { key: typeof key })
      return { ok: false, error: 'Invalid key' }
    }
    return {
      ok: true,
      slidingWindowKey: `${this.keyPrefix}${key}`,
      tokenBucketKey: `${this.keyPrefix}bucket:${key}`,
      logicalKey: key
    }
  }

  /**
   * Sliding window implementation
   * Internal helper for cleaner public API
   */
  async _checkSlidingWindow (fullKey, windowMs, maxRequests) {
    const now = Date.now()
    const windowStart = now - windowMs

    // Remove old entries outside the window
    await this.redis.zremrangebyscore(fullKey, '-inf', windowStart)

    // Count requests in current window
    const requestCount = await this.redis.zcard(fullKey)

    if (requestCount >= maxRequests) {
      const oldestRequest = await this.redis.zrange(
        fullKey,
        0,
        0,
        'WITHSCORES'
      )
      const resetTime =
        oldestRequest && oldestRequest[1]
          ? parseInt(oldestRequest[1], 10) + windowMs
          : now + windowMs

      return {
        allowed: false,
        limit: maxRequests,
        current: requestCount,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    }

    // Add current request with unique ID
    const requestId = `${now}-${Math.random().toString(36).substr(2, 9)}`
    await this.redis.zadd(fullKey, now, requestId)
    await this.redis.expire(fullKey, Math.ceil(windowMs / 1000) + 1)

    return {
      allowed: true,
      limit: maxRequests,
      current: requestCount + 1,
      resetTime: now + windowMs,
      remaining: Math.max(0, maxRequests - (requestCount + 1)),
      retryAfter: null
    }
  }

  /**
   * Token bucket implementation
   * Internal helper for cleaner public API
   */
  async _checkTokenBucket (fullKey, capacity, refillRate, tokensPerRequest) {
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
        refillRate,
        retryAfter: null
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
      retryAfter: Math.ceil(timeToWait * 1000)
    }
  }

  /**
   * Check if request is within rate limit (sliding window)
   */
  async checkLimit (key, options = {}) {
    const { ok, slidingWindowKey, error } = this._validateKey(
      key,
      'checkLimit'
    )
    if (!ok) return { allowed: false, error, retryAfter: null }

    const windowMs = options.windowMs || this.defaultWindowMs
    const maxRequests = options.maxRequests || this.defaultMaxRequests

    try {
      return await this._checkSlidingWindow(
        slidingWindowKey,
        windowMs,
        maxRequests
      )
    } catch (error) {
      logger.error('Rate limiter check failed', { key, error: error.message })
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        warning: 'Rate limiter unavailable',
        retryAfter: null
      }
    }
  }

  /**
   * Token bucket rate limiting
   */
  async checkTokenBucket (key, options = {}) {
    const { ok, tokenBucketKey, error } = this._validateKey(
      key,
      'checkTokenBucket'
    )
    if (!ok) return { allowed: false, error, retryAfter: null }

    const capacity = options.capacity || 100
    const refillRate = options.refillRate || 10
    const tokensPerRequest = Math.max(1, options.tokensPerRequest || 1)

    try {
      return await this._checkTokenBucket(
        tokenBucketKey,
        capacity,
        refillRate,
        tokensPerRequest
      )
    } catch (error) {
      logger.error('Token bucket check failed', { key, error: error.message })
      return {
        allowed: true,
        warning: 'Token bucket unavailable',
        retryAfter: null
      }
    }
  }

  /**
   * Reset rate limit for a key - clears BOTH algorithms' state
   * FIX: Now deletes both sliding-window and token-bucket keys
   */
  async reset (key) {
    const { ok, slidingWindowKey, tokenBucketKey, error } = this._validateKey(
      key,
      'reset'
    )
    if (!ok) return { success: false, error }

    try {
      // Delete both sliding-window and token-bucket keys
      // Ensures complete reset regardless of which algorithm was used
      await this.redis.del(slidingWindowKey, tokenBucketKey)
      logger.debug('Rate limit reset', { key })
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
    const { ok, slidingWindowKey, error } = this._validateKey(key, 'getStatus')
    if (!ok) return { key, error }

    const windowMs = options.windowMs || this.defaultWindowMs
    const maxRequests = options.maxRequests || this.defaultMaxRequests

    try {
      const now = Date.now()
      const windowStart = now - windowMs
      await this.redis.zremrangebyscore(slidingWindowKey, '-inf', windowStart)
      const requestCount = await this.redis.zcard(slidingWindowKey)
      const ttl = await this.redis.pttl(slidingWindowKey)

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
