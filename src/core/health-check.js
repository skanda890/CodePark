/**
 * Health Check Aggregator
 * Monitors application and dependency health
 * Features: Dependency checks, liveness probes, readiness probes
 */

const os = require('os')

class HealthCheckAggregator {
  constructor (options = {}) {
    this.checks = new Map()
    this.checkTimeout = options.checkTimeout || 5000 // 5 seconds
    this.healthThreshold = options.healthThreshold || 0.7 // 70% must be healthy
  }

  /**
   * Register a health check
   */
  registerCheck (name, checkFn) {
    if (typeof checkFn !== 'function') {
      throw new Error('Check must be a function')
    }
    this.checks.set(name, checkFn)
  }

  /**
   * Run a single check with timeout
   */
  async runCheck (name, checkFn) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Check timeout')), this.checkTimeout)
    })

    try {
      const result = await Promise.race([checkFn(), timeoutPromise])
      return {
        name,
        status: 'up',
        duration: 0,
        details: result
      }
    } catch (error) {
      return {
        name,
        status: 'down',
        duration: 0,
        error: error.message
      }
    }
  }

  /**
   * Get overall health status
   */
  async getHealthStatus () {
    const checks = await Promise.all(
      Array.from(this.checks.entries()).map(([name, checkFn]) =>
        this.runCheck(name, checkFn)
      )
    )

    const healthy = checks.filter((c) => c.status === 'up').length
    const total = checks.length
    const healthPercentage = total > 0 ? healthy / total : 1
    const overallStatus =
      healthPercentage >= this.healthThreshold ? 'up' : 'degraded'

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      systemInfo: {
        cpuCount: os.cpus().length,
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        nodeVersion: process.version
      },
      checks,
      metrics: {
        healthy,
        total,
        percentage: Math.round(healthPercentage * 100)
      }
    }
  }

  /**
   * Express middleware for health check endpoint
   */
  middleware (path = '/health') {
    return async (req, res, next) => {
      if (req.path !== path) {
        return next()
      }

      const health = await this.getHealthStatus()
      const statusCode = health.status === 'up' ? 200 : 503

      res.status(statusCode).json(health)
    }
  }
}

module.exports = HealthCheckAggregator
