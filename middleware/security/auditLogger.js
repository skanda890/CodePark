/**
 * Security Audit Logger Module
 * Logs security-relevant events
 */

/**
 * Security Audit Logger Middleware
 * Logs all requests with security context
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
      userId: req.user?.id
    }

    // Log suspicious activity (4xx and 5xx responses)
    if (res.statusCode >= 400) {
      console.warn('[SECURITY AUDIT]', JSON.stringify(logData))
    }
  })

  next()
}

module.exports = securityAuditLogger
