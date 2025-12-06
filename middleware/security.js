const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const { body, validationResult } = require('express-validator')
const Redis = require('ioredis')
const escape = require('html-escape')
const logger = require('../config/logger')

/**
 * Security Middleware Configuration
 * Implements multiple layers of security protection
 */

// Validate environment variables at startup
const requiredEnvVars = {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV
}

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  logger.warn('Missing environment variables:', missingVars)
}

// Redis client with secure configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  connectTimeout: 5000,
  commandTimeout: 5000
})

redis.on('error', (err) => {
  logger.error('Redis connection error:', err.message)
})

/**
 * Helmet Configuration - Security Headers
 * FIXED: Removed 'nonce-{random}' placeholder which is not a valid runtime nonce.
 * For production inline scripts, implement per-request nonce generation via middleware.
 * See TODO below for future enhancement.
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  expectCt: {
    maxAge: 86400,
    enforce: true
  },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
})

/**
 * TODO: Future Enhancement - Per-Request Nonce for CSP
 * When implementing inline styles that require CSP bypass, generate a unique nonce per request.
 * Example:
 *
 * const crypto = require('crypto')
 * const cspNonceMiddleware = (req, res, next) => {
 *   req.nonce = crypto.randomBytes(16).toString('base64')
 *   next()
 * }
 * const helmetWithNonce = helmet({
 *   contentSecurityPolicy: {
 *     directives: {
 *       styleSrc: (req) => [`'self'`, `'nonce-${req.nonce}'`]
 *     }
 *   }
 * })
 * Then on <style> tags: <style nonce={req.nonce}>...</style>
 */

/**
 * Rate Limiting Configuration
 * FIXED: expiry is now derived from windowMs to prevent key persistence issues
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: (req, res) => {
      logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded')
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later'
      })
    }
  }

  const finalOptions = { ...defaultOptions, ...options }

  // FIXED: Only create store if not provided; expiry derived from windowMs
  if (!finalOptions.store) {
    const windowMs = finalOptions.windowMs || defaultOptions.windowMs
    finalOptions.store = new RedisStore({
      client: redis,
      prefix: 'rl:',
      expiry: Math.ceil(windowMs / 1000) // Convert ms to seconds, matches logical window
    })
  }

  return rateLimit(finalOptions)
}

const rateLimiters = {
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  }),
  graphql: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50
  }),
  websocket: createRateLimiter({
    windowMs: 60 * 1000,
    max: 5
  })
}

/**
 * CORS Configuration - FIXED
 * Now uses callback(null, false) for disallowed origins instead of throwing errors.
 * Browser enforces CORS; non-browser clients unaffected by missing Origin header.
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ||
      'http://localhost:3000,http://localhost:3001'
    )
      .split(',')
      .map((o) => o.trim())

    // FIXED: Use callback(null, false) instead of throwing error
    // This prevents 500 errors for non-browser clients without Origin header
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn({ origin }, 'CORS request from unauthorized origin')
      callback(null, false) // FIXED: Browser enforces; return 200 but no CORS headers
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],
  maxAge: 600
}

/**
 * Request Size Limits
 */
const requestSizeLimits = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
  raw: { limit: '10mb' }
}

/**
 * Input Validation Middleware
 */
const validateInput = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((err) => ({
          field: err.param,
          message: err.msg
        }))
      })
    }

    next()
  }
}

/**
 * Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  )
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  )
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.removeHeader('X-Powered-By')

  next()
}

/**
 * CSRF Token Validation
 */
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf
  const sessionToken = req.session?.csrfToken

  if (!token || token !== sessionToken) {
    logger.warn({ requestId: req.id }, 'CSRF token validation failed')
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Request forbidden'
    })
  }

  next()
}

/**
 * Security Audit Logger
 */
const securityAuditLogger = (req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      requestId: req.id
    }

    if (res.statusCode >= 400) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        logger.warn(logData, 'Security event: unauthorized access attempt')
      } else if (res.statusCode >= 500) {
        logger.error(logData, 'Security event: server error')
      }
    }
  })

  next()
}

/**
 * HTTP Parameter Pollution (HPP) Protection
 */
const hppProtection = (req, res, next) => {
  const whitelist = ['tags', 'categories', 'ids', 'fields']

  for (const key in req.query) {
    if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
      req.query[key] = req.query[key][0]
    }
  }

  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (Array.isArray(req.body[key]) && !whitelist.includes(key)) {
        req.body[key] = req.body[key][0]
      }
    }
  }

  next()
}

/**
 * Sanitize User Input - Using proper HTML escape
 *
 * FIXED: Only escapes fields meant to be rendered as HTML/text.
 * This prevents data corruption of IDs, URLs, base64, and other non-HTML data.
 * Primary escaping should occur at output layer (templates/responses) for defense-in-depth.
 */
const sanitizeInput = (req, res, next) => {
  // Field names that are expected to contain user-facing text which will be rendered
  // in HTML contexts. Adjust this list as needed for your application.
  const textFieldsToEscape = [
    'message',
    'content',
    'title',
    'description',
    'comment',
    'bio'
  ]

  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return escape(value)
    }
    return value
  }

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

      const value = obj[key]

      // Skip null/undefined
      if (value === null || value === undefined) {
        continue
      }

      // Only escape string fields that are explicitly allowed to contain HTML/text
      if (textFieldsToEscape.includes(key) && typeof value === 'string') {
        obj[key] = sanitizeValue(value)
        continue
      }

      // Recurse into nested plain objects
      if (typeof value === 'object' && !Array.isArray(value)) {
        sanitizeObject(value)
        continue
      }

      // Handle arrays: if field name is allowlisted, sanitize string items;
      // always recurse into nested objects within arrays
      if (Array.isArray(value)) {
        obj[key] = value.map((item) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            sanitizeObject(item)
            return item
          }

          if (textFieldsToEscape.includes(key) && typeof item === 'string') {
            return sanitizeValue(item)
          }

          return item
        })
      }
    }
  }

  if (req.body) sanitizeObject(req.body)
  if (req.query) sanitizeObject(req.query)
  if (req.params) sanitizeObject(req.params)

  next()
}

module.exports = {
  helmetConfig,
  rateLimiters,
  corsOptions,
  requestSizeLimits,
  validateInput,
  securityHeaders,
  csrfProtection,
  securityAuditLogger,
  hppProtection,
  sanitizeInput,
  redis
}
