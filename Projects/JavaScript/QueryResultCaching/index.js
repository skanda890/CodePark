/**
 * Query Result Caching Service
 * Cache API query results with TTL, invalidation strategies, and metrics
 * @version 1.0.0
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class QueryCache extends EventEmitter {
  constructor(options = {}) {
    super();
    this.cache = new Map();
    this.ttl = options.ttl || 300000; // 5 minutes
    this.maxSize = options.maxSize || 1000;
    this.backend = options.backend || 'memory';
    this.invalidationRules = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Generate cache key from query and params
   * @param {string} query - Query string or name
   * @param {object} params - Query parameters
   * @returns {string} - Cache key
   */
  generateKey(query, params = {}) {
    const data = JSON.stringify({ query, params: Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {}) });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached result
   * @param {string} query - Query identifier
   * @param {object} params - Query parameters
   * @returns {object|null} - Cached result or null
   */
  get(query, params = {}) {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses += 1;
      this.emit('cache:miss', { query, key });
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses += 1;
      this.emit('cache:expired', { query, key });
      return null;
    }

    this.stats.hits += 1;
    this.emit('cache:hit', { query, key });
    return entry.data;
  }

  /**
   * Set cached result
   * @param {string} query - Query identifier
   * @param {object} params - Query parameters
   * @param {object} data - Result data
   * @param {number} ttl - Time to live in milliseconds
   */
  set(query, params = {}, data, ttl = null) {
    const key = this.generateKey(query, params);
    const actualTtl = ttl || this.ttl;

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
      query,
      params,
    });

    this.emit('cache:set', { query, key, ttl: actualTtl });
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} query - Query pattern
   * @param {object} params - Optional parameter filter
   */
  invalidate(query, params = null) {
    let invalidated = 0;

    for (const [key, entry] of this.cache) {
      if (entry.query === query) {
        if (!params || this.matchParams(entry.params, params)) {
          this.cache.delete(key);
          invalidated += 1;
        }
      }
    }

    this.emit('cache:invalidate', { query, count: invalidated });
    return invalidated;
  }

  /**
   * Check if parameters match filter
   * @private
   */
  matchParams(source, filter) {
    return Object.entries(filter).every(([key, value]) => {
      return source[key] === value || value === '*';
    });
  }

  /**
   * Register invalidation rule
   * @param {string} trigger - Trigger event name
   * @param {string} queryPattern - Query pattern to invalidate
   * @param {object} paramFilter - Parameter filter
   */
  registerInvalidationRule(trigger, queryPattern, paramFilter = {}) {
    if (!this.invalidationRules.has(trigger)) {
      this.invalidationRules.set(trigger, []);
    }
    this.invalidationRules.get(trigger).push({ queryPattern, paramFilter });
  }

  /**
   * Trigger invalidation rule
   * @param {string} trigger - Trigger event name
   */
  triggerInvalidation(trigger) {
    const rules = this.invalidationRules.get(trigger) || [];
    let totalInvalidated = 0;

    for (const rule of rules) {
      totalInvalidated += this.invalidate(rule.queryPattern, rule.paramFilter);
    }

    this.emit('cache:rule-triggered', { trigger, invalidated: totalInvalidated });
  }

  /**
   * Evict oldest entry
   * @private
   */
  evictOldest() {
    let oldest = null;
    let oldestKey = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.timestamp < oldest.timestamp) {
        oldest = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions += 1;
      this.emit('cache:evicted', { key: oldestKey });
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cache:cleared', { size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0,
    };
  }

  /**
   * Middleware for Express
   * @param {Function} options - Configuration
   */
  middleware(options = {}) {
    return (req, res, next) => {
      const cacheKey = options.keyGenerator ? options.keyGenerator(req) : req.url;
      const cached = this.get(cacheKey);

      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (data) => {
        this.set(cacheKey, {}, data);
        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    };
  }
}

module.exports = QueryCache;
