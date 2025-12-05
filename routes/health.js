/**
 * Health Check Routes
 * Kubernetes-compatible liveness and readiness probes
 */

const express = require('express')
const router = express.Router()
const cacheService = require('../services/cache')
const websocketService = require('../services/websocket')
const config = require('../config')

/**
 * GET /health
 * General health check
 */
router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: config.nodeEnv,
    features: {
      websocket: config.websocket.enabled,
      redis: config.redis.enabled,
      metrics: config.metrics.enabled,
      caching: config.cache.enabled,
      compression: config.compression.enabled
    },
    connections: {
      websocket: config.websocket.enabled
        ? websocketService.getConnectionCount()
        : 0
    }
  }

  res.json(health)
})

/**
 * GET /health/live
 * Liveness probe - is the app running?
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /health/ready
 * Readiness probe - is the app ready to serve traffic?
 */
router.get('/ready', async (req, res) => {
  const checks = {
    server: 'ok',
    cache: 'unknown',
    websocket: 'unknown'
  }

  // Check cache service
  try {
    if (config.cache.enabled) {
      const available = cacheService.isAvailable()
      checks.cache = available ? 'ok' : 'degraded'
    } else {
      checks.cache = 'disabled'
    }
  } catch (error) {
    checks.cache = 'error'
  }

  // Check WebSocket service
  try {
    if (config.websocket.enabled) {
      checks.websocket = 'ok'
    } else {
      checks.websocket = 'disabled'
    }
  } catch (error) {
    checks.websocket = 'error'
  }

  const allOk = Object.values(checks).every(
    (status) =>
      status === 'ok' || status === 'disabled' || status === 'degraded'
  )

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks
  })
})

module.exports = router
