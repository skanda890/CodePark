/**
 * IP Whitelisting Service
 * Advanced access control with CIDR notation and dynamic updates
 * @version 1.0.0
 */

const net = require('net')
const EventEmitter = require('events')

class IPWhitelistService extends EventEmitter {
  constructor (options = {}) {
    super()
    this.whitelist = new Set()
    this.blacklist = new Set()
    this.ipTiers = new Map()
    this.requestCounts = new Map()
    this.enforceMode = options.enforceMode || 'whitelist'
    this.cacheTimeout = options.cacheTimeout || 3600000
    this.maxRequestsPerIp = options.maxRequestsPerIp || 1000
  }

  /**
   * Add IP or CIDR to whitelist
   * @param {string} ipOrCidr - IP address or CIDR notation
   * @param {object} metadata - Optional metadata
   */
  addToWhitelist (ipOrCidr, metadata = {}) {
    try {
      this.validateIpOrCidr(ipOrCidr)
      this.whitelist.add({
        value: ipOrCidr,
        metadata,
        addedAt: Date.now()
      })
      this.emit('whitelist:added', { ip: ipOrCidr })
    } catch (error) {
      throw new Error(`Invalid IP/CIDR: ${error.message}`)
    }
  }

  /**
   * Remove IP or CIDR from whitelist
   * @param {string} ipOrCidr - IP address or CIDR notation
   */
  removeFromWhitelist (ipOrCidr) {
    for (const entry of this.whitelist) {
      if (entry.value === ipOrCidr) {
        this.whitelist.delete(entry)
        this.emit('whitelist:removed', { ip: ipOrCidr })
        return true
      }
    }
    return false
  }

  /**
   * Add IP to blacklist
   * @param {string} ip - IP address
   * @param {object} metadata - Optional metadata
   */
  addToBlacklist (ip, metadata = {}) {
    this.blacklist.add({
      value: ip,
      metadata,
      addedAt: Date.now()
    })
    this.emit('blacklist:added', { ip })
  }

  /**
   * Set tier for IP (for rate limiting)
   * @param {string} ipOrCidr - IP address or CIDR
   * @param {string} tier - Tier name (free, premium, enterprise)
   */
  setIpTier (ipOrCidr, tier) {
    this.ipTiers.set(ipOrCidr, {
      tier,
      setAt: Date.now()
    })
  }

  /**
   * Check if IP is whitelisted
   * @param {string} ip - IP address to check
   * @returns {boolean} - Whether IP is allowed
   */
  isWhitelisted (ip) {
    // Check blacklist first
    if (this.isBlacklisted(ip)) {
      this.recordAccess(ip, false)
      return false
    }

    if (this.enforceMode === 'off') {
      this.recordAccess(ip, true)
      return true
    }

    // Check exact IP matches
    for (const entry of this.whitelist) {
      if (entry.value === ip) {
        this.recordAccess(ip, true)
        return true
      }
    }

    // Check CIDR matches
    for (const entry of this.whitelist) {
      if (this.isCidr(entry.value)) {
        if (this.isIpInCidr(ip, entry.value)) {
          this.recordAccess(ip, true)
          return true
        }
      }
    }

    this.recordAccess(ip, false)
    return false
  }

  /**
   * Check if IP is blacklisted
   * @private
   */
  isBlacklisted (ip) {
    for (const entry of this.blacklist) {
      if (entry.value === ip) return true
    }
    return false
  }

  /**
   * Check if IP is in CIDR range
   * @private
   */
  isIpInCidr (ip, cidr) {
    try {
      const [network, bits] = cidr.split('/')
      const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1)
      return (this.ipToInt(ip) & mask) === (this.ipToInt(network) & mask)
    } catch {
      return false
    }
  }

  /**
   * Convert IP to integer
   * @private
   */
  ipToInt (ip) {
    return (
      ip.split('.').reduce((acc, octet) => {
        return (acc << 8) + parseInt(octet, 10)
      }, 0) >>> 0
    )
  }

  /**
   * Check if format is CIDR notation
   * @private
   */
  isCidr (value) {
    return value.includes('/')
  }

  /**
   * Validate IP or CIDR format
   * @private
   */
  validateIpOrCidr (value) {
    if (value.includes('/')) {
      // CIDR validation
      const [ip, bits] = value.split('/')
      if (!net.isIPv4(ip)) throw new Error('Invalid IPv4 address')
      const bitsNum = parseInt(bits, 10)
      if (isNaN(bitsNum) || bitsNum < 0 || bitsNum > 32) {
        throw new Error('Invalid CIDR bits')
      }
    } else if (!net.isIPv4(value)) {
      throw new Error('Invalid IPv4 address')
    }
  }

  /**
   * Record access attempt
   * @private
   */
  recordAccess (ip, allowed) {
    const key = `${ip}:${Date.now()}`
    this.requestCounts.set(key, allowed)
    this.emit('access', { ip, allowed })
  }

  /**
   * Check rate limit for IP
   * @param {string} ip - IP address
   * @returns {boolean} - Whether within rate limit
   */
  checkRateLimit (ip) {
    const now = Date.now()
    const ipRequests = Array.from(this.requestCounts.keys()).filter(
      (key) =>
        key.startsWith(ip) &&
        now - this.cacheTimeout < parseInt(key.split(':')[1], 10)
    ).length

    return ipRequests < this.maxRequestsPerIp
  }

  /**
   * Get whitelist entries
   */
  getWhitelist () {
    return Array.from(this.whitelist)
  }

  /**
   * Get IP statistics
   * @param {string} ip - IP address
   */
  getIpStats (ip) {
    const entries = Array.from(this.requestCounts.keys()).filter((key) =>
      key.startsWith(ip)
    )
    return {
      ip,
      totalRequests: entries.length,
      allowedRequests: entries.filter((key) => this.requestCounts.get(key))
        .length,
      deniedRequests: entries.filter((key) => !this.requestCounts.get(key))
        .length,
      tier: this.ipTiers.get(ip)?.tier || 'free'
    }
  }

  /**
   * Middleware for Express
   * @param {Function} options - Configuration
   */
  middleware (options = {}) {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress

      if (!this.isWhitelisted(ip)) {
        return res.status(403).json({
          status: 'error',
          message: 'IP not whitelisted'
        })
      }

      if (!this.checkRateLimit(ip)) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded'
        })
      }

      next()
    }
  }
}

module.exports = IPWhitelistService
