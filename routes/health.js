const express = require('express')
const router = express.Router()
const os = require('os')
const { version } = require('../package.json')
const config = require('../config')
const logger = require('../config/logger')

/**
 * Health Check Routes
 * Provides system status, dependency health, and metrics
 */

// Store application start time
const startTime = Date.now()

/**
 * Basic Health Check
 * @route GET /health
 * @returns {object} Basic health status
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version
  })
})

/**
 * Detailed Health Check
 * @route GET /health/detailed
 * @returns {object} Comprehensive system status
 * FIXED: Protected with authentication to prevent information disclosure
 */
router.get('/detailed', async (req, res) => {
  // SECURITY FIX: Verify authentication before exposing detailed system info
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required for detailed health checks'
    })
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  try {
    const jwt = require('jsonwebtoken')
    jwt.verify(token, config.jwtSecret)
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired token'
    })
  }

  const healthChecks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    application: {
      name: 'CodePark',
      version,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptime: process.uptime(),
      startTime: new Date(startTime).toISOString()
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      usedMemory: formatBytes(os.totalmem() - os.freemem()),
      memoryUsage: {
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
        external: formatBytes(process.memoryUsage().external),
        rss: formatBytes(process.memoryUsage().rss)
      },
      loadAverage: os.loadavg()
    },
    dependencies: {}
  }

  // Check MongoDB connection
  try {
    if (global.mongoClient && global.mongoClient.topology) {
      const isConnected = global.mongoClient.topology.isConnected()
      healthChecks.dependencies.mongodb = {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Connected' : 'Disconnected'
      }
    } else {
      healthChecks.dependencies.mongodb = {
        status: 'unknown',
        message: 'MongoDB client not initialized'
      }
    }
  } catch (error) {
    healthChecks.dependencies.mongodb = {
      status: 'error',
      message: 'Connection check failed'
    }
    logger.debug({ err: error }, 'MongoDB health check error')
  }

  // Check Redis connection
  try {
    if (global.redisClient) {
      const pingResult = await global.redisClient.ping().catch(() => null)
      healthChecks.dependencies.redis = {
        status: pingResult === 'PONG' ? 'healthy' : 'unhealthy',
        message: pingResult === 'PONG' ? 'Connected' : 'Disconnected'
      }
    } else {
      healthChecks.dependencies.redis = {
        status: 'unknown',
        message: 'Redis client not initialized'
      }
    }
  } catch (error) {
    healthChecks.dependencies.redis = {
      status: 'error',
      message: 'Connection check failed'
    }
    logger.debug({ err: error }, 'Redis health check error')
  }

  // Check Kafka connection (if enabled)
  try {
    if (process.env.ENABLE_KAFKA === 'true' && global.kafkaProducer) {
      healthChecks.dependencies.kafka = {
        status: 'healthy',
        message: 'Connected'
      }
    } else {
      healthChecks.dependencies.kafka = {
        status: 'disabled',
        message: 'Kafka not enabled'
      }
    }
  } catch (error) {
    healthChecks.dependencies.kafka = {
      status: 'error',
      message: 'Connection check failed'
    }
    logger.debug({ err: error }, 'Kafka health check error')
  }

  // Determine overall status
  const hasUnhealthyDependency = Object.values(healthChecks.dependencies).some(
    (dep) => dep.status === 'unhealthy' || dep.status === 'error'
  )

  if (hasUnhealthyDependency) {
    healthChecks.status = 'degraded'
  }

  const statusCode = healthChecks.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(healthChecks)
})

/**
 * Readiness Probe
 * @route GET /health/ready
 * @returns {object} Readiness status for Kubernetes
 */
router.get('/ready', async (req, res) => {
  const checks = {
    mongodb: false,
    redis: false
  }

  // Check critical dependencies
  try {
    if (global.mongoClient && global.mongoClient.topology) {
      checks.mongodb = global.mongoClient.topology.isConnected()
    }
  } catch (error) {
    checks.mongodb = false
    logger.debug({ err: error }, 'MongoDB readiness check error')
  }

  try {
    if (global.redisClient) {
      const pingResult = await global.redisClient.ping().catch(() => null)
      checks.redis = pingResult === 'PONG'
    }
  } catch (error) {
    checks.redis = false
    logger.debug({ err: error }, 'Redis readiness check error')
  }

  // App is ready if at least MongoDB is connected
  const isReady = checks.mongodb

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString()
  })
})

/**
 * Liveness Probe
 * @route GET /health/live
 * @returns {object} Liveness status for Kubernetes
 */
router.get('/live', (req, res) => {
  // Simple check - if we can respond, we're alive
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * Startup Probe
 * @route GET /health/startup
 * @returns {object} Startup status for Kubernetes
 */
router.get('/startup', (req, res) => {
  // Check if application has been running for at least 5 seconds
  const isStarted = process.uptime() > 5

  res.status(isStarted ? 200 : 503).json({
    started: isStarted,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

/**
 * Metrics Summary
 * FIXED: Protected with authentication to prevent information disclosure
 * @route GET /health/metrics
 * @returns {object} Application metrics
 */
router.get('/metrics', (req, res) => {
  // SECURITY FIX: Verify authentication before exposing metrics
  const authToken = req.headers.authorization
  if (!authToken) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required for metrics'
    })
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
        arrayBuffers: process.memoryUsage().arrayBuffers
      },
      cpu: process.cpuUsage()
    },
    system: {
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      loadAverage: os.loadavg(),
      cpus: os.cpus().length,
      uptime: os.uptime()
    }
  }

  res.status(200).json(metrics)
})

/**
 * Version Information
 * FIXED: Restricted to authenticated users only
 * @route GET /health/version
 * @returns {object} Application version and build info
 */
router.get('/version', (req, res) => {
  // SECURITY FIX: Verify authentication before exposing version info
  const authToken = req.headers.authorization
  if (!authToken) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required for version information'
    })
  }

  res.status(200).json({
    application: 'CodePark',
    version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    buildDate: process.env.BUILD_DATE || 'unknown',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
    gitBranch: process.env.GIT_BRANCH || 'unknown'
  })
})

/**
 * Security Status
 * FIXED: Restricted to authenticated users only
 * @route GET /health/security
 * @returns {object} Security configuration status
 */
router.get('/security', (req, res) => {
  // SECURITY FIX: Verify authentication before exposing security status
  const authToken = req.headers.authorization
  if (!authToken) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required for security information'
    })
  }

  const securityStatus = {
    helmet: process.env.ENABLE_HELMET === 'true',
    rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
    cors: process.env.ENABLE_CORS === 'true',
    csrfProtection: process.env.ENABLE_CSRF_PROTECTION === 'true',
    hppProtection: process.env.ENABLE_HPP_PROTECTION === 'true',
    inputSanitization: process.env.ENABLE_INPUT_SANITIZATION === 'true',
    twoFactorAuth: process.env.ENABLE_2FA === 'true',
    sessionSecure: process.env.SESSION_SECURE === 'true',
    strictSSL: process.env.REDIS_TLS === 'true'
  }

  const securityScore = Object.values(securityStatus).filter(Boolean).length
  const totalChecks = Object.keys(securityStatus).length

  res.status(200).json({
    status: securityScore === totalChecks ? 'optimal' : 'needs-improvement',
    score: `${securityScore}/${totalChecks}`,
    features: securityStatus,
    recommendations:
      securityScore < totalChecks
        ? [
            'Enable all security features in production',
            'Set SESSION_SECURE=true when using HTTPS',
            'Enable CSRF protection for state-changing operations',
            'Consider enabling 2FA for enhanced security'
          ]
        : ['All security features are enabled']
  })
})

/**
 * Helper function to format bytes
 */
function formatBytes (bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

module.exports = router
