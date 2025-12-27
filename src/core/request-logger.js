/**
 * Request Logger Module
 * Centralized request/response logging with sanitization
 * Features: PII protection, request correlation, audit trails
 */

const crypto = require('crypto')

class RequestLogger {
  constructor (options = {}) {
    this.logger = options.logger || console
    this.excludePaths = options.excludePaths || ['/health', '/metrics']
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
      'email',
      'phone'
    ]
  }

  /**
   * Generate unique request ID for tracing
   */
  generateRequestId () {
    return crypto.randomUUID()
  }

  /**
   * Sanitize object by removing sensitive fields
   */
  sanitizeData (data, depth = 0) {
    const MAX_DEPTH = 5

    if (depth > MAX_DEPTH) {
      return '[Max depth exceeded]'
    }

    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item, depth + 1))
    }

    const sanitized = {}

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value, depth + 1)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Check if field name is sensitive
   */
  isSensitiveField (fieldName) {
    const lower = fieldName.toLowerCase()
    return this.sensitiveFields.some((field) => lower.includes(field))
  }

  /**
   * Express middleware for request logging
   */
  middleware () {
    return (req, res, next) => {
      // Generate request ID
      req.id = this.generateRequestId()
      const startTime = Date.now()

      // Skip logging for excluded paths
      if (this.excludePaths.some((path) => req.path.startsWith(path))) {
        return next()
      }

      // Capture response end
      const originalEnd = res.end
      let responseBody = ''

      res.end = function (...args) {
        responseBody = args[0]
        originalEnd.apply(res, args)
      }

      // Log request
      const log = {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        query: this.sanitizeData(req.query),
        body: this.sanitizeData(req.body),
        statusCode: res.statusCode,
        duration: `${Date.now() - startTime}ms`
      }

      // Log to logger
      if (res.statusCode >= 400) {
        this.logger.error('Request error:', log)
      } else {
        this.logger.info('Request:', log)
      }

      next()
    }
  }
}

module.exports = RequestLogger
