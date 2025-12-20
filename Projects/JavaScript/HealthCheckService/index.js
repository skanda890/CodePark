/**
 * Health Check Service
 * Service health monitoring with dependency verification and readiness probes
 * @version 1.0.0
 */

const EventEmitter = require('events')

class HealthCheckService extends EventEmitter {
  constructor (options = {}) {
    super()
    this.checks = new Map()
    this.status = 'starting'
    this.startTime = Date.now()
    this.lastUpdate = null
    this.failureThreshold = options.failureThreshold || 3
    this.checkTimeout = options.checkTimeout || 5000
    this.failureCounts = new Map()
  }

  /**
   * Register a health check
   * @param {string} name - Check name
   * @param {Function} checkFn - Check function
   * @param {object} options - Check options
   */
  registerCheck (name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      critical: options.critical || false,
      timeout: options.timeout || this.checkTimeout,
      description: options.description || name
    })
  }

  /**
   * Register a liveness probe
   * @param {Function} checkFn - Liveness check function
   */
  registerLivenessProbe (checkFn) {
    this.registerCheck('liveness', checkFn, {
      critical: true,
      description: 'Liveness probe to check if service is running'
    })
  }

  /**
   * Register a readiness probe
   * @param {Function} checkFn - Readiness check function
   */
  registerReadinessProbe (checkFn) {
    this.registerCheck('readiness', checkFn, {
      critical: true,
      description: 'Readiness probe to check if service is ready'
    })
  }

  /**
   * Run a single health check
   * @private
   */
  async runCheck (name, check) {
    const startTime = Date.now()

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Check timeout')), check.timeout)
      )

      const result = await Promise.race([check.fn(), timeoutPromise])

      const duration = Date.now() - startTime
      const success =
        result === true ||
        (typeof result === 'object' && result.status === 'ok')

      if (success) {
        this.failureCounts.set(name, 0)
      } else {
        this.incrementFailure(name)
      }

      return {
        name,
        status: success ? 'healthy' : 'unhealthy',
        duration,
        error: null,
        timestamp: Date.now()
      }
    } catch (error) {
      this.incrementFailure(name)
      return {
        name,
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Increment failure count
   * @private
   */
  incrementFailure (name) {
    const count = (this.failureCounts.get(name) || 0) + 1
    this.failureCounts.set(name, count)

    if (count >= this.failureThreshold) {
      this.emit('check:failed', { name, count })
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks () {
    const results = []
    const promises = []

    for (const [name, check] of this.checks) {
      promises.push(this.runCheck(name, check))
    }

    const checkResults = await Promise.all(promises)
    results.push(...checkResults)

    // Determine overall status
    const hasUnhealthy = results.some((r) => r.status === 'unhealthy')
    const hasCriticalFailure = results.some(
      (r) => r.status === 'unhealthy' && this.checks.get(r.name)?.critical
    )

    this.status = hasCriticalFailure
      ? 'unhealthy'
      : hasUnhealthy
        ? 'degraded'
        : 'healthy'
    this.lastUpdate = Date.now()

    this.emit('checks:complete', { status: this.status, results })

    return {
      status: this.status,
      timestamp: this.lastUpdate,
      uptime: Date.now() - this.startTime,
      checks: results
    }
  }

  /**
   * Get current health status
   */
  async getStatus () {
    return this.runAllChecks()
  }

  /**
   * Get liveness status
   */
  async getLiveness () {
    const check = this.checks.get('liveness')
    if (!check) return { status: 'unknown' }

    const result = await this.runCheck('liveness', check)
    return {
      status: result.status === 'healthy' ? 'alive' : 'dead',
      timestamp: result.timestamp
    }
  }

  /**
   * Get readiness status
   */
  async getReadiness () {
    const check = this.checks.get('readiness')
    if (!check) return { status: 'unknown' }

    const result = await this.runCheck('readiness', check)
    return {
      status: result.status === 'healthy' ? 'ready' : 'not_ready',
      timestamp: result.timestamp
    }
  }

  /**
   * Express middleware for health endpoint
   */
  healthMiddleware () {
    return async (req, res) => {
      const health = await this.getStatus()

      const statusCode =
        health.status === 'healthy'
          ? 200
          : health.status === 'degraded'
            ? 503
            : 500

      res.status(statusCode).json(health)
    }
  }

  /**
   * Express middleware for liveness probe
   */
  livenessMiddleware () {
    return async (req, res) => {
      const liveness = await this.getLiveness()
      const statusCode = liveness.status === 'alive' ? 200 : 500
      res.status(statusCode).json(liveness)
    }
  }

  /**
   * Express middleware for readiness probe
   */
  readinessMiddleware () {
    return async (req, res) => {
      const readiness = await this.getReadiness()
      const statusCode = readiness.status === 'ready' ? 200 : 503
      res.status(statusCode).json(readiness)
    }
  }

  /**
   * Get check statistics
   */
  getStats () {
    return {
      status: this.status,
      uptime: Date.now() - this.startTime,
      lastUpdate: this.lastUpdate,
      failureCounts: Object.fromEntries(this.failureCounts),
      registeredChecks: this.checks.size
    }
  }
}

module.exports = HealthCheckService
