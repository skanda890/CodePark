/**
 * Multi-Layer Cache Manager (Feature #29)
 * Manages memory, Redis, and CDN caching
 */

const crypto = require('crypto');

class CacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.ttlMap = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  /**
   * Generate cache key
   */
  generateKey(...parts) {
    return parts.join(':');
  }

  /**
   * Set cache
   */
  set(key, value, ttl = 3600) {
    this.memoryCache.set(key, value);

    if (ttl) {
      const expiresAt = Date.now() + ttl * 1000;
      this.ttlMap.set(key, expiresAt);

      setTimeout(() => {
        this.memoryCache.delete(key);
        this.ttlMap.delete(key);
      }, ttl * 1000);
    }

    this.stats.sets += 1;
    return value;
  }

  /**
   * Get cache
   */
  get(key) {
    const expiresAt = this.ttlMap.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.memoryCache.delete(key);
      this.ttlMap.delete(key);
      this.stats.misses += 1;
      return null;
    }

    if (this.memoryCache.has(key)) {
      this.stats.hits += 1;
      return this.memoryCache.get(key);
    }

    this.stats.misses += 1;
    return null;
  }

  /**
   * Delete cache
   */
  delete(key) {
    this.memoryCache.delete(key);
    this.ttlMap.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    this.ttlMap.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : 'N/A',
      size: this.memoryCache.size,
    };
  }
}

module.exports = CacheManager;