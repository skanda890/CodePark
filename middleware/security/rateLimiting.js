const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../../infrastructure/redisClient');

/**
 * Rate Limiting Module
 * Creates rate limiters with proper configuration and bug fixes
 */

/**
 * Create a rate limiter with merged defaults
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
  // Merge with defaults BEFORE using in handler
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
  };

  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options };

  // Extract windowMs for use in handler (fixes NaN bug)
  const effectiveWindowMs = mergedOptions.windowMs;

  // Create handler with properly merged windowMs
  const handler = (req, res) => {
    // Use req.rateLimit.resetTime if available (most accurate)
    // Otherwise fall back to calculated value from effectiveWindowMs
    const retryAfter = req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      : Math.ceil(effectiveWindowMs / 1000);

    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter,
    });
  };

  // Add handler to merged options
  mergedOptions.handler = handler;

  return rateLimit(mergedOptions);
};

/**
 * Pre-configured rate limiters for different endpoints
 */
const rateLimiters = {
  // General API rate limiter
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }),

  // Stricter rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
  }),

  // GraphQL endpoint rate limiting
  graphql: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
  }),

  // WebSocket connection rate limiting
  websocket: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
  }),
};

module.exports = {
  createRateLimiter,
  rateLimiters,
};
