const crypto = require('crypto')

class APIKeyManager {
  constructor () {
    this.keys = new Map()
    this.usageStats = new Map()
  }

  generateKey (userId, scopes = [], name = 'Unnamed Key') {
    const key = 'sk_' + crypto.randomBytes(32).toString('hex')
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')

    const apiKey = {
      id: Math.random().toString(36).substring(7),
      keyHash,
      userId,
      scopes,
      name,
      createdAt: new Date(),
      expiresAt: null,
      lastUsed: null,
      active: true,
      rateLimitPerHour: 1000
    }

    this.keys.set(keyHash, apiKey)
    this.usageStats.set(keyHash, { requests: 0, lastReset: Date.now() })

    return key // Return unhashed key only once
  }

  async validateKey (key) {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')
    const apiKey = this.keys.get(keyHash)

    if (!apiKey || !apiKey.active) {
      return { valid: false, error: 'Invalid or inactive key' }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'Key expired' }
    }

    // Check rate limit
    const stats = this.usageStats.get(keyHash)
    if (stats.requests >= apiKey.rateLimitPerHour) {
      return { valid: false, error: 'Rate limit exceeded' }
    }

    return { valid: true, apiKey }
  }

  async recordUsage (key) {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')
    const apiKey = this.keys.get(keyHash)
    if (apiKey) {
      apiKey.lastUsed = new Date()
      const stats = this.usageStats.get(keyHash)
      stats.requests++
    }
  }

  revokeKey (keyId) {
    for (const [hash, key] of this.keys.entries()) {
      if (key.id === keyId) {
        key.active = false
        return true
      }
    }
    return false
  }

  listKeys (userId) {
    const userKeys = []
    for (const [hash, key] of this.keys.entries()) {
      if (key.userId === userId && key.active) {
        userKeys.push({
          id: key.id,
          name: key.name,
          scopes: key.scopes,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed
        })
      }
    }
    return userKeys
  }
}

module.exports = APIKeyManager
