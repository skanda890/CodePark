/**
 * Advanced Configuration Manager
 * Manages application configuration with validation and defaults
 * Features: Environment-based config, validation, secrets management
 */

class ConfigurationManager {
  constructor (options = {}) {
    this.env = process.env.NODE_ENV || 'development'
    this.config = {}
    this.defaults = options.defaults || {}
    this.validators = new Map()
    this.loadConfig()
  }

  /**
   * Load configuration from environment and defaults
   */
  loadConfig () {
    // Merge defaults with environment-specific config
    this.config = {
      ...this.defaults,
      ...this.loadEnvConfig()
    }

    // Validate configuration
    this.validate()
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvConfig () {
    const config = {}

    // Database config
    config.database = {
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '27017', 10),
      name: process.env.DB_NAME || 'codepark',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }

    // Redis config
    config.redis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD
    }

    // Server config
    config.server = {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      env: this.env
    }

    // JWT config
    config.jwt = {
      secret: process.env.JWT_SECRET,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    }

    // Logging config
    config.logging = {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    }

    return config
  }

  /**
   * Register validator for config field
   */
  registerValidator (field, validator) {
    this.validators.set(field, validator)
  }

  /**
   * Validate configuration
   */
  validate () {
    const errors = []

    // Validate JWT secret
    if (!this.config.jwt?.secret) {
      errors.push('JWT_SECRET environment variable is required')
    } else if (this.config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters')
    }

    // Validate database config
    if (!this.config.database?.host) {
      errors.push('Database host is required')
    }

    // Run custom validators
    for (const [field, validator] of this.validators.entries()) {
      const value = this.get(field)
      const error = validator(value)
      if (error) {
        errors.push(error)
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
  }

  /**
   * Get configuration value by path
   */
  get (path) {
    if (!path) {
      return this.config
    }

    const keys = path.split('.')
    let value = this.config

    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) {
        return undefined
      }
    }

    return value
  }

  /**
   * Check if configuration key exists
   */
  has (path) {
    return this.get(path) !== undefined
  }

  /**
   * Get all configuration
   */
  getAll () {
    // Remove sensitive data from returned config
    const safeConfig = JSON.parse(JSON.stringify(this.config))
    if (safeConfig.jwt?.secret) {
      safeConfig.jwt.secret = '[REDACTED]'
    }
    if (safeConfig.database?.password) {
      safeConfig.database.password = '[REDACTED]'
    }
    if (safeConfig.redis?.password) {
      safeConfig.redis.password = '[REDACTED]'
    }
    return safeConfig
  }
}

module.exports = ConfigurationManager
