/**
 * Cache Middleware
 * Response caching
 */

const cacheService = require('../services/cache');
const metricsService = require('../services/metrics');
const logger = require('../config/logger');
const config = require('../config');

/**
 * Create cache middleware with optional key function
 * @param {Function} keyFn - Function to generate cache key
 * @param {number} ttl - Time to live in seconds
 */
module.exports = function createCacheMiddleware(keyFn, ttl = config.cache.ttl) {
  return async (req, res, next) => {
    if (!config.cache.enabled) {
      return next();
    }

    try {
      // Generate cache key
      const key = keyFn ? keyFn(req) : `cache:${req.method}:${req.path}`;

      // Try to get from cache
      const cached = await cacheService.get(key);

      if (cached) {
        metricsService.recordCacheHit();
        logger.debug({ key, requestId: req.id }, 'Cache hit');
        return res.json(cached);
      }

      metricsService.recordCacheMiss();
      logger.debug({ key, requestId: req.id }, 'Cache miss');

      // Intercept res.json to cache response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Cache the response
        cacheService
          .set(key, data, ttl)
          .catch((err) => logger.error({ err, key }, 'Error caching response'));

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ err: error, requestId: req.id }, 'Cache middleware error');
      next();
    }
  };
};
