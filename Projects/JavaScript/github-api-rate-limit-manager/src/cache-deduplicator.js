/**
 * Cache & Deduplication Module for GitHub API Rate Limit Manager
 *
 * Features:
 * - TTL-based cache expiration (configurable)
 * - ETag validation for conditional requests
 * - Request deduplication (SHA-256 hashing)
 * - Time-window deduplication (5 seconds default)
 * - Max size enforcement with LRU eviction
 * - Cache and deduplication statistics
 */

const crypto = require('crypto')

class CacheDeduplicator {
  constructor (config = {}) {
    this.cache = new Map()
    this.deduplicationWindow = new Map()
    this.etagMap = new Map()

    // Configuration
    this.ttl = config.ttl || 300000 // 5 minutes default
    this.maxCacheSize = config.maxCacheSize || 1000
    this.deduplicationTime = config.deduplicationTime || 5000 // 5 seconds
    this.lruOrder = [] // Track access order for LRU eviction

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      deduplicated: 0,
      etagValidated: 0,
      evicted: 0,
      expired: 0,
      totalCached: 0
    }
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey (request) {
    const key = {
      method: request.method || 'GET',
      endpoint: request.endpoint,
      params: JSON.stringify(request.params || {}),
      headers: JSON.stringify(request.headers || {})
    }

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(key))
      .digest('hex')
  }

  /**
   * Set cache value with TTL
   */
  set (request, response, options = {}) {
    const key = this.generateCacheKey(request)
    const now = Date.now()
    const ttl = options.ttl || this.ttl

    // Check if cache is full, evict if needed
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU()
    }

    const cacheEntry = {
      key,
      response,
      createdAt: now,
      expiresAt: now + ttl,
      etag: response.headers?.etag || null,
      lastModified: response.headers?.['last-modified'] || null,
      hitCount: 0,
      lastAccessTime: now
    }

    this.cache.set(key, cacheEntry)
    this.updateLRU(key)
    this.stats.totalCached++

    // Store ETag for conditional requests
    if (cacheEntry.etag) {
      this.etagMap.set(key, cacheEntry.etag)
    }

    return { cached: true, key, expiresIn: ttl }
  }

  /**
   * Get cached value
   */
  get (request) {
    const key = this.generateCacheKey(request)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return { hit: false, key }
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.expired++
      this.stats.misses++
      return { hit: false, key, expired: true }
    }

    // Update statistics
    entry.hitCount++
    entry.lastAccessTime = Date.now()
    this.stats.hits++
    this.updateLRU(key)

    return {
      hit: true,
      key,
      response: entry.response,
      etag: entry.etag,
      lastModified: entry.lastModified,
      age: Date.now() - entry.createdAt,
      hitCount: entry.hitCount
    }
  }

  /**
   * Check for request deduplication
   */
  isDuplicate (request) {
    const key = this.generateCacheKey(request)
    const now = Date.now()

    // Check if request is in deduplication window
    if (this.deduplicationWindow.has(key)) {
      const timestamp = this.deduplicationWindow.get(key)

      if (now - timestamp < this.deduplicationTime) {
        this.stats.deduplicated++
        return { duplicate: true, key, age: now - timestamp }
      } else {
        // Window expired, remove from deduplication
        this.deduplicationWindow.delete(key)
      }
    }

    // Add to deduplication window
    this.deduplicationWindow.set(key, now)
    return { duplicate: false, key }
  }

  /**
   * Validate with ETag (conditional request)
   */
  getETag (request) {
    const key = this.generateCacheKey(request)
    return this.etagMap.get(key) || null
  }

  /**
   * Update cached response with ETag validation
   */
  updateWithETag (request, response) {
    const key = this.generateCacheKey(request)
    const entry = this.cache.get(key)

    if (!entry) {
      return { updated: false, notInCache: true }
    }

    // If 304 Not Modified, use cached response
    if (response.status === 304) {
      this.stats.etagValidated++
      entry.lastAccessTime = Date.now()
      return {
        updated: false,
        notModified: true,
        response: entry.response,
        message: 'Using cached response (304 Not Modified)'
      }
    }

    // Update cache with new response
    const cacheEntry = {
      ...entry,
      response,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl,
      etag: response.headers?.etag || entry.etag
    }

    this.cache.set(key, cacheEntry)

    if (cacheEntry.etag) {
      this.etagMap.set(key, cacheEntry.etag)
    }

    return { updated: true, response }
  }

  /**
   * LRU (Least Recently Used) eviction
   */
  evictLRU () {
    if (this.lruOrder.length > 0) {
      const keyToEvict = this.lruOrder.shift()
      this.cache.delete(keyToEvict)
      this.etagMap.delete(keyToEvict)
      this.stats.evicted++
    }
  }

  /**
   * Update LRU order
   */
  updateLRU (key) {
    // Remove if exists
    const index = this.lruOrder.indexOf(key)
    if (index > -1) {
      this.lruOrder.splice(index, 1)
    }
    // Add to end (most recently used)
    this.lruOrder.push(key)
  }

  /**
   * Clear specific cache entry
   */
  invalidate (request) {
    const key = this.generateCacheKey(request)
    const existed = this.cache.has(key)

    this.cache.delete(key)
    this.etagMap.delete(key)
    this.deduplicationWindow.delete(key)

    const index = this.lruOrder.indexOf(key)
    if (index > -1) {
      this.lruOrder.splice(index, 1)
    }

    return { invalidated: existed, key }
  }

  /**
   * Clear entire cache
   */
  clearAll () {
    const size = this.cache.size
    this.cache.clear()
    this.etagMap.clear()
    this.deduplicationWindow.clear()
    this.lruOrder = []
    return { cleared: size }
  }

  /**
   * Get cache statistics
   */
  getStats () {
    const total = this.stats.hits + this.stats.misses
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0

    return {
      ...this.stats,
      hitRate: hitRate + '%',
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      utilizationPercentage:
        ((this.cache.size / this.maxCacheSize) * 100).toFixed(2) + '%',
      lruOrderSize: this.lruOrder.length,
      etagCaches: this.etagMap.size,
      deduplicationWindow: this.deduplicationWindow.size
    }
  }

  /**
   * Get cache health
   */
  getHealth () {
    const stats = this.getStats()
    const hitRate = parseFloat(stats.hitRate)

    let status = 'healthy'
    if (hitRate < 50) status = 'degraded'
    if (hitRate < 30) status = 'poor'

    return {
      status,
      hitRate: stats.hitRate,
      recommendation:
        hitRate < 60
          ? 'Consider increasing TTL or cache size'
          : 'Cache is working well'
    }
  }

  /**
   * Get cache entries for debugging
   */
  getEntries (limit = 10) {
    const entries = []
    const now = Date.now()

    let count = 0
    for (const [key, entry] of this.cache) {
      if (count >= limit) break

      entries.push({
        key,
        age: now - entry.createdAt,
        expiresIn: Math.max(0, entry.expiresAt - now),
        hitCount: entry.hitCount,
        hasETag: !!entry.etag
      })
      count++
    }

    return entries
  }

  /**
   * Automatic cleanup of expired entries
   */
  cleanup () {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        this.etagMap.delete(key)
        cleanedCount++
      }
    }

    // Clean deduplication window
    for (const [key, timestamp] of this.deduplicationWindow) {
      if (now - timestamp > this.deduplicationTime) {
        this.deduplicationWindow.delete(key)
      }
    }

    return { cleaned: cleanedCount }
  }
}

module.exports = CacheDeduplicator
