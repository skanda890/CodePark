/**
 * API Rate Limiting Service (Feature #46)
 * Advanced rate limiting with multiple strategies
 */

class RateLimitingService {
  constructor (options = {}) {
    this.strategies = new Map()
    this.limits = new Map()
    this.defaultLimit = options.defaultLimit || 100
    this.defaultWindow = options.defaultWindow || 60000 // 1 minute
  }

  /**
   * Register rate limit strategy
   */
  registerStrategy (name, strategy) {
    this.strategies.set(name, strategy)
  }

  /**
   * Check rate limit
   */
  checkLimit (identifier, options = {}) {
    const limit = options.limit || this.defaultLimit
    const window = options.window || this.defaultWindow
    const strategy = options.strategy || 'token-bucket'

    const key = `${strategy}:${identifier}`
    const now = Date.now()

    if (!this.limits.has(key)) {
      this.limits.set(key, {
        requests: [],
        firstRequestTime: now
      })
    }

    const limitData = this.limits.get(key)

    // Remove old requests outside the window
    limitData.requests = limitData.requests.filter(
      (time) => now - time < window
    )

    if (limitData.requests.length >= limit) {
      const oldestRequest = limitData.requests[0]
      const resetTime = oldestRequest + window

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    }

    limitData.requests.push(now)

    return {
      allowed: true,
      remaining: limit - limitData.requests.length,
      limit,
      resetTime: now + window
    }
  }

  /**
   * Reset limit for identifier
   */
  resetLimit (identifier) {
    for (const [key] of this.limits) {
      if (key.includes(identifier)) {
        this.limits.delete(key)
      }
    }
  }
}

module.exports = RateLimitingService
