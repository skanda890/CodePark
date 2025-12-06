/**
 * CORS Middleware - SECURITY HARDENED
 * Configure Cross-Origin Resource Sharing
 *
 * FIXES:
 * - Extracted decision logic into pure function for testability
 * - Uses callback(null, false) instead of throwing errors (preserves non-browser clients)
 * - Properly scoped production Origin requirement
 * - Debug localhost references removed
 */

const logger = require('../config/logger')

/**
 * Pure CORS decision function
 * Determines CORS headers based on request origin and configuration
 * Returns an object describing the decision without side effects
 */
function decideCors ({ origin, env, allowedOrigins, path }) {
  const isProd = env === 'production'

  // Production requires Origin header for browser security
  // Non-browser clients (apps, servers) can proceed without it
  if (!origin && isProd) {
    return {
      // Return null for origin - browser will see no CORS headers
      // Server-to-server/app-to-app calls proceed normally
      log: { level: 'info', msg: 'CORS: Request without origin in production', ctx: { path } }
    }
  }

  // Check if origin is whitelisted
  if (origin && allowedOrigins.includes(origin)) {
    return {
      allowOrigin: origin,
      allowCredentials: true,
      log: { level: 'debug', msg: 'CORS: Request from allowed origin', ctx: { origin } }
    }
  }

  // Development: allow requests without origin from whitelisted first entry
  if (!origin && !isProd) {
    return {
      allowOrigin: allowedOrigins[0],
      allowCredentials: false,
      log: { level: 'debug', msg: 'CORS: Development mode, allowing first whitelisted origin', ctx: { origin: allowedOrigins[0] } }
    }
  }

  // Unauthorized origin
  if (origin) {
    return {
      // Return null - browser won't see CORS headers, request will fail in browser
      // Non-browser clients unaffected
      log: { level: 'warn', msg: 'CORS: Request from unauthorized origin', ctx: { origin, path } }
    }
  }

  // Fallback: no credentials, no origin header
  return { log: { level: 'debug', msg: 'CORS: Default fallback', ctx: { path } } }
}

/**
 * Create CORS middleware with proper origin validation
 * @param {string} allowedOrigins - Comma-separated allowed origins (env var or config)
 * @returns {Function} Express middleware
 */
module.exports = function createCorsMiddleware (allowedOrigins = 'http://localhost:3000') {
  const allowedOriginsList = allowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)

  const env = process.env.NODE_ENV || 'development'

  return (req, res, next) => {
    const origin = req.headers.origin

    // Get CORS decision
    const decision = decideCors({ origin, env, allowedOrigins: allowedOriginsList, path: req.path })

    // Log if present (only info/warn/error level, not debug in production)
    if (decision.log && !(decision.log.level === 'debug' && env === 'production')) {
      logger[decision.log.level](decision.log.ctx, decision.log.msg)
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
