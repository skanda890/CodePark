/**
 * Feature Flag Manager (Feature #11)
 * Manages feature toggles for gradual rollout and A/B testing
 */

const redis = require('redis')

class FeatureFlagManager {
  constructor (options = {}) {
    this.redisClient =
      options.redisClient ||
      redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      })
    this.flags = new Map()
  }

  /**
   * Register feature flag
   */
  registerFlag (name, options = {}) {
    const flag = {
      name,
      enabled: options.enabled || false,
      rolloutPercentage: options.rolloutPercentage || 0,
      userWhitelist: options.userWhitelist || [],
      userBlacklist: options.userBlacklist || [],
      description: options.description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.flags.set(name, flag)
    return flag
  }

  /**
   * Check if feature is enabled for user
   */
  async isEnabled (flagName, userId = null) {
    const flag = this.flags.get(flagName)
    if (!flag) {
      return false
    }

    // Check blacklist
    if (flag.userBlacklist.includes(userId)) {
      return false
    }

    // Check whitelist
    if (flag.userWhitelist.includes(userId)) {
      return true
    }

    // Check global enable
    if (flag.enabled && flag.rolloutPercentage === 100) {
      return true
    }

    // Check rollout percentage
    if (flag.rolloutPercentage > 0 && userId) {
      const hash = require('crypto')
        .createHash('md5')
        .update(`${flagName}:${userId}`)
        .digest('hex')
      const hashNum = parseInt(hash.substring(0, 8), 16)
      const percentage = (hashNum % 100) + 1
      return percentage <= flag.rolloutPercentage
    }

    return false
  }

  /**
   * Enable/disable flag
   */
  async toggleFlag (flagName, enabled, rolloutPercentage = null) {
    const flag = this.flags.get(flagName)
    if (!flag) {
      throw new Error(`Flag ${flagName} not found`)
    }

    flag.enabled = enabled
    if (rolloutPercentage !== null) {
      flag.rolloutPercentage = rolloutPercentage
    }
    flag.updatedAt = new Date()

    // Persist to Redis
    await this.redisClient.setex(
      `feature_flag:${flagName}`,
      86400,
      JSON.stringify(flag)
    )

    return flag
  }

  /**
   * Get all flags
   */
  getAllFlags () {
    return Array.from(this.flags.values())
  }
}

module.exports = FeatureFlagManager
