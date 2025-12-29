/**
 * Universal Error Handler Framework
 * Centralized error handling with consistent response format
 * Features: Error logging, stack traces, user-friendly messages
 */

class AppError extends Error {
  constructor (message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.timestamp = new Date().toISOString()
    this.isOperational = true // For distinguishing programming errors

    Error.captureStackTrace(this, this.constructor)
  }
}

class ErrorHandler {
  constructor (options = {}) {
    this.logger = options.logger || console
    this.isDevelopment = options.isDevelopment !== false
    this.errorHandlers = new Map()
    this.setupDefaultHandlers()
  }

  /**
   * Setup default error handlers for common error types
   */
  setupDefaultHandlers () {
    // Handle JWT errors
    this.registerHandler('JsonWebTokenError', (error) => {
      return new AppError('Invalid token', 401, 'INVALID_TOKEN')
    })

    this.registerHandler('TokenExpiredError', (error) => {
      return new AppError('Token expired', 401, 'TOKEN_EXPIRED')
    })

    // Handle MongoDB errors
    this.registerHandler('MongoServerError', (error) => {
      if (error.code === 11000) {
        return new AppError('Duplicate field value', 400, 'DUPLICATE_ENTRY')
      }
      return new AppError('Database error', 500, 'DB_ERROR')
    })

    // Handle validation errors
    this.registerHandler('ValidationError', (error) => {
      return new AppError(error.message, 400, 'VALIDATION_ERROR')
    })
  }

  /**
   * Register custom error handler
   */
  registerHandler (errorType, handler) {
    this.errorHandlers.set(errorType, handler)
  }

  /**
   * Handle error and return formatted response
   */
  handle (error) {
    // Check if registered handler exists
    if (this.errorHandlers.has(error.name)) {
      const handler = this.errorHandlers.get(error.name)
      return handler(error)
    }

    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error
    }

    // Log unexpected error
    this.logger.error('Unexpected error:', error)

    // Return generic error for unknown errors
    return new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR')
  }

  /**
   * Express error middleware
   */
  middleware () {
    return (error, req, res, next) => {
      const appError = this.handle(error)

      const response = {
        error: {
          code: appError.code,
          message: appError.message,
          timestamp: appError.timestamp
        }
      }

      // Include stack trace in development
      if (this.isDevelopment) {
        response.error.stack = appError.stack
      }

      // Include request ID if available
      if (req.id) {
        response.error.requestId = req.id
      }

      res.status(appError.statusCode).json(response)
    }
  }

  /**
   * Async error wrapper for Express routes
   */
  static asyncHandler (fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
}

module.exports = { AppError, ErrorHandler }
