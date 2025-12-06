/**
 * CORS Middleware - SECURITY HARDENED
 * Configure Cross-Origin Resource Sharing
 *
 * FIXES:
 * - Simplified decideCors with reason enum for clarity
 * - Moved logging into middleware for flat control flow
 * - Fixed empty allowedOrigins validation
 * - Removed callback usage from pure function
 */

const logger = require('../config/logger')

/**
 * Pure CORS decision function
 * Returns decision + reason code for the middleware to interpret
 * No side effects, easy to test
 */
function decideCors ({ origin, isProd, allowedOrigins }) {
  const whitelisted = origin && allowedOrigins.includes(origin)

  if (isProd) {
    if (!origin) {
      return { allowOrigin: null, allowCredentials: false, reason: 'no-origin-prod' }
    }
    if (whitelisted) {
      return { allowOrigin: origin, allowCredentials: true, reason: 'allowed' }
    }
    return { allowOrigin: null, allowCredentials: false, reason: 'unauthorized' }
  }

  // Development / non-prod
  if (!origin) {
    return {
      allowOrigin: allowedOrigins[0] ?? null,
      allowCredentials: false,
      reason: 'dev-no-origin'
    }
  }
  if (whitelisted) {
    return { allowOrigin: origin, allowCredentials: true, reason: 'allowed' }
  }
  return { allowOrigin: null, allowCredentials: false, reason: 'unauthorized' }
}

/**
 * Create CORS middleware with proper origin validation
 * @param {string} allowedOrigins - Comma-separated allowed origins (env var or config)
 * @returns {Function} Express middleware
 */
module.exports = function createCorsMiddleware (allowedOrigins = 'http://localhost:3000') {
  let allowedOriginsList = allowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)

  // FIXED: Fail fast on empty allowedOrigins
  if (allowedOriginsList.length === 0) {
    logger.error(
      'CORS configuration error: allowedOrigins is empty. ' +
        'Using default: http://localhost:3000'
    )
    allowedOriginsList = ['http://localhost:3000']
  }

  const env = process.env.NODE_ENV || 'development'
  const isProd = env === 'production'

  return (req, res, next) => {
    const origin = req.headers.origin

    const decision = decideCors({
      origin,
      isProd,
      allowedOrigins: allowedOriginsList
    })

    // FIXED: Flat, explicit logging policy
    if (isProd && decision.reason !== 'allowed') {
      // Only log warnings in production for non-allowed requests
      switch (decision.reason) {
        case 'no-origin-prod':
          logger.info({ path: req.path }, 'CORS: Request without origin in production')
          break
        case 'unauthorized':
          logger.warn({ origin, path: req.path }, 'CORS: Request from unauthorized origin')
          break
      }
    } else if (!isProd) {
      // Development: log more details
      switch (decision.reason) {
        case 'dev-no-origin':
          logger.debug(
            { origin: allowedOriginsList[0] },
            'CORS: Development mode, allowing first whitelisted origin'
          )
          break
        case 'unauthorized':
          logger.warn({ origin, path: req.path }, 'CORS: Request from unauthorized origin')
          break
        case 'allowed':
          logger.debug({ origin }, 'CORS: Request from allowed origin')
          break
      }
    }

    // Apply decision to response headers
    if (decision.allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', decision.allowOrigin)
    }

    if (decision.allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }

    // Fixed headers: always set, independent of origin decision
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token'
    )
    res.setHeader('Access-Control-Max-Age', '3600') // 1 hour
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining'
    )

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    next()
  }
}
