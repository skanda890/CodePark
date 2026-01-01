/**
 * CORS configuration validation
 * Prevents credentials + wildcard misconfiguration
 * Phase 2 Security Implementation - CVE-3 Fix
 */

class CORSValidator {
  static validate (config) {
    const errors = []
    const warnings = []

    // CRITICAL: credentials + wildcard
    if (config.credentials === true && config.origins.includes('*')) {
      errors.push('CRITICAL: Cannot enable credentials with wildcard origin')
    }

    // Check origins list is not empty
    if (!Array.isArray(config.origins) || config.origins.length === 0) {
      errors.push('ERROR: CORS origins list is empty')
    }

    // Validate each origin
    config.origins.forEach((origin, idx) => {
      if (origin === '*') return

      try {
        new URL(origin)
      } catch {
        errors.push(`ERROR: Invalid origin URL at index ${idx}: ${origin}`)
      }

      if (origin.includes('*')) {
        warnings.push(`WARNING: Wildcard in origin at index ${idx}: ${origin}`)
      }
    })

    // Warn about localhost in production
    if (process.env.NODE_ENV === 'production') {
      config.origins.forEach((origin, idx) => {
        if (
          origin.includes('localhost') ||
          origin === 'http://localhost:3000'
        ) {
          warnings.push(
            `WARNING: Localhost origin in production at index ${idx}`
          )
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: {
        origins: config.origins,
        credentials: config.credentials,
        methods: config.methods || ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400
      }
    }
  }

  static createMiddleware (config) {
    const validation = this.validate(config)

    if (!validation.valid) {
      throw new Error(
        `CORS Configuration Error: ${validation.errors.join(', ')}`
      )
    }

    validation.warnings.forEach((w) => {
      global.logger?.warn(w)
    })

    return (req, res, next) => {
      const origin = req.get('origin')

      if (!origin) return next()

      const isAllowed = validation.config.origins.includes(origin)

      if (!isAllowed && origin !== 'null') {
        global.logger?.warn('CORS_VIOLATION', {
          origin,
          path: req.path,
          ip: req.ip
        })

        return res.status(403).json({
          error: 'CORS policy violation',
          code: 'CORS_BLOCKED'
        })
      }

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader(
        'Access-Control-Allow-Methods',
        validation.config.methods.join(', ')
      )
      res.setHeader(
        'Access-Control-Allow-Headers',
        validation.config.allowedHeaders.join(', ')
      )
      res.setHeader(
        'Access-Control-Expose-Headers',
        validation.config.exposedHeaders.join(', ')
      )

      if (validation.config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      res.setHeader('Access-Control-Max-Age', validation.config.maxAge)

      // Handle preflight
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
      }

      next()
    }
  }
}

module.exports = CORSValidator
