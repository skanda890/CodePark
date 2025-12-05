/**
 * Prometheus Metrics Service
 * Exposes application metrics
 */

const client = require('prom-client')
const express = require('express')
const config = require('../config')
const logger = require('../config/logger')

class MetricsService {
  constructor () {
    this.register = new client.Registry()
    this.metricsServer = null

    // Default metrics
    client.collectDefaultMetrics({ register: this.register })

    // Custom metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    })

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    })

    this.activeGames = new client.Gauge({
      name: 'active_games_total',
      help: 'Number of active games',
      registers: [this.register]
    })

    this.wsConnections = new client.Gauge({
      name: 'websocket_connections_total',
      help: 'Number of active WebSocket connections',
      registers: [this.register]
    })

    this.cacheHits = new client.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      registers: [this.register]
    })

    this.cacheMisses = new client.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      registers: [this.register]
    })
  }

  /**
   * Initialize metrics middleware
   * @param {Object} app - Express app
   */
  init (app) {
    if (!config.metrics.enabled) return

    // Track HTTP requests
    app.use((req, res, next) => {
      const start = Date.now()

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000
        const route = req.route ? req.route.path : req.path

        this.httpRequestDuration.observe(
          {
            method: req.method,
            route,
            status_code: res.statusCode
          },
          duration
        )

        this.httpRequestTotal.inc({
          method: req.method,
          route,
          status_code: res.statusCode
        })
      })

      next()
    })
  }

  /**
   * Start metrics server
   */
  startServer () {
    if (!config.metrics.enabled) return

    const metricsApp = express()

    metricsApp.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.register.contentType)
      res.send(await this.register.metrics())
    })

    this.metricsServer = metricsApp.listen(config.metrics.port, () => {
      logger.info(`✅ Metrics server running on port ${config.metrics.port}`)
    })
  }

  /**
   * Record HTTP request (for manual tracking)
   */
  recordHttpRequest (req, res, statusCode) {
    if (!config.metrics.enabled) return

    const route = req.route ? req.route.path : req.path
    this.httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode
    })
  }

  /**
   * Update active games count
   */
  updateActiveGames (count) {
    if (!config.metrics.enabled) return
    this.activeGames.set(count)
  }

  /**
   * Update WebSocket connections count
   */
  updateWsConnections (count) {
    if (!config.metrics.enabled) return
    this.wsConnections.set(count)
  }

  /**
   * Record cache hit
   */
  recordCacheHit () {
    if (!config.metrics.enabled) return
    this.cacheHits.inc()
  }

  /**
   * Record cache miss
   */
  recordCacheMiss () {
    if (!config.metrics.enabled) return
    this.cacheMisses.inc()
  }

  /**
   * Close metrics server
   */
  close () {
    if (this.metricsServer) {
      this.metricsServer.close()
      logger.info('Metrics server closed')
    }
  }
}

module.exports = new MetricsService()
