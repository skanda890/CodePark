class RateLimiter {
  constructor (options = {}) {
    this.windowMs = options.windowMs || 60000 // 1 minute
    this.maxRequests = options.maxRequests || 100
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false
    this.store = new Map()
  }

  middleware () {
    return (req, res, next) => {
      const key = this.getKey(req)
      const record = this.getOrCreateRecord(key)

      if (record.count >= this.maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000)
        })
        return
      }

      record.count++
      res.setHeader('X-RateLimit-Limit', this.maxRequests)
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - record.count)
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(record.resetTime).toISOString()
      )

      next()
    }
  }

  getKey (req) {
    const ip = req.ip || req.connection.remoteAddress
    return ip
  }

  getOrCreateRecord (key) {
    let record = this.store.get(key)
    if (!record || record.resetTime < Date.now()) {
      record = {
        count: 0,
        resetTime: Date.now() + this.windowMs
      }
      this.store.set(key, record)
    }
    return record
  }

  reset (key) {
    this.store.delete(key)
  }
}

module.exports = RateLimiter
