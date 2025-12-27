/**
 * Request Deduplication Engine
 * Prevents duplicate request processing
 * Features: Idempotency keys, result caching, deduplication
 */

const crypto = require('crypto');
const redis = require('redis');

class RequestDeduplicator {
  constructor(options = {}) {
    this.redisClient = options.redisClient || redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    });
    this.cacheTTL = options.cacheTTL || 24 * 60 * 60; // 24 hours
    this.idempotencyKeyHeader = options.idempotencyKeyHeader || 'idempotency-key';
  }

  /**
   * Generate idempotency key from request
   */
  generateKey(req) {
    const method = req.method;
    const path = req.path;
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex')
      .substring(0, 8);

    return `${method}:${path}:${bodyHash}`;
  }

  /**
   * Check if request is duplicate and get cached result
   */
  async getCachedResult(idempotencyKey) {
    try {
      const cached = await this.redisClient.get(
        `dedup:${idempotencyKey}`
      );

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error('Error getting cached result:', error);
      return null;
    }
  }

  /**
   * Cache request result
   */
  async cacheResult(idempotencyKey, result) {
    try {
      await this.redisClient.setex(
        `dedup:${idempotencyKey}`,
        this.cacheTTL,
        JSON.stringify(result)
      );
    } catch (error) {
      console.error('Error caching result:', error);
    }
  }

  /**
   * Express middleware for request deduplication
   */
  middleware() {
    return async (req, res, next) => {
      // Only deduplicate unsafe methods (POST, PUT, PATCH, DELETE)
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return next();
      }

      // Get idempotency key from header or generate
      let idempotencyKey = req.get(this.idempotencyKeyHeader);
      if (!idempotencyKey) {
        idempotencyKey = this.generateKey(req);
      }

      // Check for cached result
      const cachedResult = await this.getCachedResult(idempotencyKey);
      if (cachedResult) {
        return res.status(cachedResult.statusCode).json(cachedResult.body);
      }

      // Capture response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;

      res.status = function (code) {
        statusCode = code;
        return originalStatus(code);
      };

      res.json = function (body) {
        // Cache successful responses
        if (statusCode < 400) {
          this.cacheResult(idempotencyKey, { statusCode, body });
        }

        return originalJson(body);
      };

      next();
    };
  }
}

module.exports = RequestDeduplicator;
