/**
 * Security Middleware - Main Export
 * Provides a single import point for all security components
 */

const { helmetConfig, securityHeaders } = require('./headers')
const { rateLimiters, createRateLimiter } = require('./rateLimiting')
const validateInput = require('./validation')
const csrfProtection = require('./csrf')
const hppProtection = require('./hpp')
const sanitizeInput = require('./sanitize')
const securityAuditLogger = require('./auditLogger')
const { corsOptions, requestSizeLimits } = require('./cors')

module.exports = {
  // Headers
  helmetConfig,
  securityHeaders,

  // Rate Limiting
  rateLimiters,
  createRateLimiter,

  // Input Validation & Sanitization
  validateInput,
  sanitizeInput,

  // Protection Middleware
  csrfProtection,
  hppProtection,

  // Audit & Logging
  securityAuditLogger,

  // CORS & Request Limits
  corsOptions,
  requestSizeLimits
}
