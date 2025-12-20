/**
 * Authentication Configuration
 * Centralized config with hard-fail on insecure settings in production
 */

const logger = require('../services/logger')

const getAuthConfig = () => {
  const jwtSecret = process.env.JWT_SECRET
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'

  // Hard-fail in production/staging without proper secrets
  if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production') {
    if (isProduction || nodeEnv === 'staging') {
      throw new Error(
        'FATAL: JWT_SECRET not properly configured for production. ' +
          'Set JWT_SECRET environment variable before deploying.'
      )
    }
    if (!isDevelopment) {
      logger.warn(
        'Using default JWT_SECRET - this is only safe in development'
      )
    }
  }

  if (
    !refreshSecret ||
    refreshSecret === 'your-refresh-secret-change-in-production'
  ) {
    if (isProduction || nodeEnv === 'staging') {
      throw new Error(
        'FATAL: JWT_REFRESH_SECRET not properly configured for production. ' +
          'Set JWT_REFRESH_SECRET environment variable before deploying.'
      )
    }
    if (!isDevelopment) {
      logger.warn(
        'Using default JWT_REFRESH_SECRET - this is only safe in development'
      )
    }
  }

  return {
    jwtSecret: jwtSecret || 'dev-jwt-secret-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    refreshSecret: refreshSecret || 'dev-refresh-secret-change-in-production',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    isDevelopment,
    isProduction
  }
}

// Validate on module load
const config = getAuthConfig()

module.exports = config
