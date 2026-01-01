/**
 * Request validation middleware using Zod
 * Validates content-type, payload size, and schema
 * Phase 2 Security Implementation - CVE-2 Fix
 */

const { z } = require('zod')

function validateInput(schema) {
  return (req, res, next) => {
    try {
      // Validate content-type
      const contentType = req.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        return res.status(400).json({
          error: 'Invalid content-type. Expected application/json',
          code: 'INVALID_CONTENT_TYPE'
        })
      }

      // Validate payload size
      const contentLength = parseInt(req.get('content-length') || '0')
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Payload too large',
          code: 'PAYLOAD_TOO_LARGE'
        })
      }

      // Validate against schema
      const validated = schema.parse(req.body)
      req.validatedData = validated

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }

      global.logger?.error('Validation error', {
        error: error.message,
        path: req.path,
        method: req.method
      })

      return res.status(500).json({
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      })
    }
  }
}

module.exports = validateInput
