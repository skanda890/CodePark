/**
 * Production-grade error handling
 * Sanitizes errors in production, detailed in development
 * Phase 2 Security Implementation - CVE-7 Fix
 */

const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  AUTH_REQUIRED: 401,
  AUTH_INVALID: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  DUPLICATE_RESOURCE: 409,
  CONFLICT: 409,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}

function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const statusCode = err.statusCode || ERROR_CODES.INTERNAL_ERROR
  const errorCode = err.code || 'INTERNAL_ERROR'

  global.logger?.error('REQUEST_ERROR', {
    message: err.message,
    code: errorCode,
    statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    stack: isDevelopment ? err.stack : undefined
  })

  const response = {
    error: sanitizeErrorMessage(err.message, isDevelopment),
    code: errorCode,
    status: statusCode
  }

  if (isDevelopment) {
    response.stack = err.stack
    response.details = err.details
  }

  if (req.id) {
    response.requestId = req.id
  }

  res.status(statusCode).json(response)
}

function sanitizeErrorMessage(message, isDevelopment) {
  if (isDevelopment) {
    return message
  }

  if (!message) {
    return 'An error occurred'
  }

  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /api[_-]?key/gi,
    /\d{16,}/g
  ]

  let sanitized = message

  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  })

  return sanitized
}

module.exports = {
  errorHandler,
  sanitizeErrorMessage,
  ERROR_CODES
}
