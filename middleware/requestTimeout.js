/**
 * Request timeout middleware with per-endpoint configuration
 * Prevents slow client attacks and socket exhaustion
 * Phase 2 Security Implementation - CVE-6 Fix
 */

const DEFAULT_TIMEOUTS = {
  API: 30 * 1000,
  AUTH: 10 * 1000,
  UPLOAD: 5 * 60 * 1000,
  GRAPHQL: 30 * 1000
}

function requestTimeout (timeoutMs = DEFAULT_TIMEOUTS.API) {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      global.logger?.warn('REQUEST_TIMEOUT', {
        path: req.path,
        method: req.method,
        duration: timeoutMs
      })

      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT'
        })
      }

      req.socket.destroy()
    })

    res.on('finish', () => {
      res.clearTimeout()
    })

    req.socket.on('error', (error) => {
      global.logger?.error('SOCKET_ERROR', {
        path: req.path,
        error: error.message
      })
    })

    next()
  }
}

function createTimeoutMiddleware () {
  return {
    api: requestTimeout(DEFAULT_TIMEOUTS.API),
    auth: requestTimeout(DEFAULT_TIMEOUTS.AUTH),
    upload: requestTimeout(DEFAULT_TIMEOUTS.UPLOAD),
    graphql: requestTimeout(DEFAULT_TIMEOUTS.GRAPHQL),
    custom: (ms) => requestTimeout(ms)
  }
}

module.exports = {
  requestTimeout,
  createTimeoutMiddleware,
  DEFAULT_TIMEOUTS
}
