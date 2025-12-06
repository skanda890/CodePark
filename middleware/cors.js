/**
 * CORS Middleware - SECURITY FIXED
 * Configure Cross-Origin Resource Sharing
 * CRITICAL FIX: Never set credentials:true with Access-Control-Allow-Origin: *
 */

const logger = require('../config/logger')

/**
 * Create CORS middleware with proper origin validation
 * @param {string} allowedOrigins - Comma-separated allowed origins
 * @returns {Function} Express middleware
 */
module.exports = function createCorsMiddleware (
  allowedOrigins = 'http://localhost:3000'
) {
  return (req, res, next) => {
    const origin = req.headers.origin
    const allowedOriginsList = allowedOrigins.split(',').map((o) => o.trim())
    const nodeEnv = process.env.NODE_ENV || 'development'

    // SECURITY: In production, reject requests without origin
    if (nodeEnv === 'production' && !origin) {
      logger.warn(
        { path: req.path },
        'CORS: Request without origin in production'
      )
      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin header required'
      })
    }

    // Check if origin is allowed
    if (origin && allowedOriginsList.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      // SECURITY: Only set credentials when explicitly allowing specific origins
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    } else if (!origin && nodeEnv === 'development') {
      // Development: allow requests without origin
      res.setHeader('Access-Control-Allow-Origin', allowedOriginsList[0])
    } else if (origin) {
      // Log unauthorized CORS attempts
      logger.warn(
        { origin, path: req.path },
        'CORS: Request from unauthorized origin'
      )
      // Still add CORS headers but don't authorize
      res.setHeader('Access-Control-Allow-Origin', 'null')
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    )
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
