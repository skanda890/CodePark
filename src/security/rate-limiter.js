/**
 * Rate Limiter Module
 * Implements Redis-backed rate limiting to prevent DoS attacks
 * Features: Token bucket algorithm, per-IP limiting, custom limits
 */

const redis = require('redis')

class RateLimiter {
  constructor (options = {}) {
    this.redisClient =
      options.redisClient ||
      redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      })

    // Default limits
    this.defaultLimit = options.defaultLimit || 100 // requests
    this.defaultWindow = options.defaultWindow || 15 * 60 // 15 minutes in seconds
    this.limits = new Map(options.limits || [])
  }

  /**
   * Check if request is allowed
   * Uses token bucket algorithm with sliding window
   * @param {string} identifier - IP, user ID, or API key
   * @param {Object} options - Custom limit options
   * @returns {Object} - { allowed: boolean, remaining: number, resetAt: Date }
   */
  async isAllowed (identifier, options = {}) {
    const limit = options.limit || this.defaultLimit
    const window = options.window || this.defaultWindow
    const key = `rate_limit:${identifier}`

    try {
      const client = this.redisClient
      const current = await client.get(key)
      const count = current ? parseInt(current, 10) : 0

      if (count >= limit) {
        // Get TTL for reset time
        const ttl = await client.ttl(key)
        const resetAt = new Date(Date.now() + ttl * 1000)

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter: ttl
        }
      }

      // Increment counter
      const newCount = count + 1
      const remaining = limit - newCount

      if (newCount === 1) {
        // First request in window
        await client.setex(key, window, newCount.toString())
      } else {
        // Increment existing counter
        await client.incr(key)
      }

      const ttl = await client.ttl(key)
      const resetAt = new Date(Date.now() + ttl * 1000)

      return {
        allowed: true,
        remaining,
        resetAt,
        retryAfter: null
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open - allow request if Redis is down
      return { allowed: true, remaining: this.defaultLimit, resetAt: null }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  async reset (identifier) {
    const key = `rate_limit:${identifier}`
    await this.redisClient.del(key)
    return true
  }

  /**
   * Get current count for identifier
   */
  async getCount (identifier) {
    const key = `rate_limit:${identifier}`
    const count = await this.redisClient.get(key)
    return parseInt(count || '0', 10)
  }

  /**
   * Express middleware for rate limiting
   */
  middleware (options = {}) {
    return async (req, res, next) => {
      const identifier = req.ip || req.connection.remoteAddress
      const result = await this.isAllowed(identifier, options)

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.limit || this.defaultLimit)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', result.resetAt?.toISOString())

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter)
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Retry after ${result.retryAfter} seconds`,
          resetAt: result.resetAt
        })
      }

      next()
    }
  }
}

module.exports = RateLimiter
