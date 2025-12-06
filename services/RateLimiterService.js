/**
 * RateLimiterService - API Rate Limiting
 * Implements configurable rate limiting for API protection
 */

class RateLimiterService {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 100, // Max requests per window
      message: options.message || 'Too many requests, please try again later',
      statusCode: options.statusCode || 429,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || this._defaultKeyGenerator,
      handler: options.handler || this._defaultHandler,
      skip: options.skip || (() => false),
      ...options
    };

    this.clients = new Map();
    this.resetTimer = null;
    this._startResetTimer();
  }

  /**
   * Get middleware function for Express
   * @returns {Function} Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      // Check if request should be skipped
      if (await this.options.skip(req, res)) {
        return next();
      }

      const key = this.options.keyGenerator(req);
      const client = this._getClient(key);

      // Check if limit exceeded
      if (client.count >= this.options.max) {
        return this.options.handler(req, res, next);
      }

      // Increment counter
      client.count++;
      client.lastRequest = Date.now();

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.options.max - client.count));
      res.setHeader('X-RateLimit-Reset', new Date(client.resetTime).toISOString());

      // Handle response tracking
      if (this.options.skipSuccessfulRequests || this.options.skipFailedRequests) {
        const originalSend = res.send.bind(res);
        res.send = (body) => {
          const statusCode = res.statusCode;
          const isSuccess = statusCode >= 200 && statusCode < 400;

          if ((isSuccess && this.options.skipSuccessfulRequests) ||
              (!isSuccess && this.options.skipFailedRequests)) {
            client.count--;
          }

          return originalSend(body);
        };
      }

      next();
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Client key
   */
  reset(key) {
    this.clients.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.clients.clear();
  }

  /**
   * Get current status for a key
   * @param {string} key - Client key
   * @returns {Object} Rate limit status
   */
  getStatus(key) {
    const client = this.clients.get(key);
    
    if (!client) {
      return {
        count: 0,
        remaining: this.options.max,
        limit: this.options.max,
        resetTime: Date.now() + this.options.windowMs
      };
    }

    return {
      count: client.count,
      remaining: Math.max(0, this.options.max - client.count),
      limit: this.options.max,
      resetTime: client.resetTime
    };
  }

  /**
   * Stop the rate limiter and clean up
   */
  stop() {
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
      this.resetTimer = null;
    }
    this.clients.clear();
  }

  /**
   * Private: Get or create client record
   */
  _getClient(key) {
    if (!this.clients.has(key)) {
      this.clients.set(key, {
        count: 0,
        resetTime: Date.now() + this.options.windowMs,
        lastRequest: Date.now()
      });
    }
    return this.clients.get(key);
  }

  /**
   * Private: Default key generator (uses IP address)
   */
  _defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress;
  }

  /**
   * Private: Default rate limit handler
   */
  _defaultHandler(req, res) {
    res.status(this.options.statusCode).json({
      error: this.options.message,
      retryAfter: Math.ceil(this.options.windowMs / 1000)
    });
  }

  /**
   * Private: Start automatic reset timer
   */
  _startResetTimer() {
    this.resetTimer = setInterval(() => {
      const now = Date.now();
      
      for (const [key, client] of this.clients.entries()) {
        if (now >= client.resetTime) {
          this.clients.delete(key);
        }
      }
    }, 60000); // Check every minute
  }
}

module.exports = RateLimiterService;
