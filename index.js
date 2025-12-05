const express = require('express')
const helmet = require('helmet')
const compression = require('compression')
const { v4: uuidv4 } = require('uuid')
const logger = require('./config/logger')
const { startCliGame } = require('./cliGame')
const config = require('./config')

// Middleware
const { rateLimiter, gameRateLimiter } = require('./middleware/rateLimiter')
const cors = require('./middleware/cors')
const requestLogger = require('./middleware/requestLogger')
const authMiddleware = require('./middleware/auth')
const cacheMiddleware = require('./middleware/cache')

// Routes
const authRoutes = require('./routes/auth')
const gameRoutes = require('./routes/game')
const healthRoutes = require('./routes/health')
const metricsRoutes = require('./routes/metrics')

// Services
const metricsService = require('./services/metrics')
const websocketService = require('./services/websocket')
const cacheService = require('./services/cache')

const app = express()
const {port} = config

// Initialize metrics
metricsService.init(app)

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// Security Middleware - Helmet for HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
)

// Compression
if (config.compression.enabled) {
  app.use(
    compression({
      level: config.compression.level,
      threshold: config.compression.threshold
    })
  )
}

// Rate limiting
app.use(rateLimiter)

// Body parsing middleware with size limits
app.use(express.json({ limit: config.maxRequestSize }))
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }))

// CORS configuration
app.use(cors(config.allowedOrigin))

// Request ID tracking
app.use((req, res, next) => {
  req.id = uuidv4()
  res.setHeader('X-Request-ID', req.id)
  next()
})

// Request logging
app.use(requestLogger)

// API Routes
app.get('/', (req, res) => {
  res.json({
    name: 'CodePark API - BLEEDING EDGE EXPERIMENTAL',
    version: '2.0.0',
    status: 'running',
    warning: 'This server uses experimental pre-release packages',
    features: {
      websocket: config.websocket.enabled,
      authentication: true,
      caching: config.cache.enabled,
      metrics: config.metrics.enabled,
      compression: config.compression.enabled
    },
    endpoints: {
      auth: '/api/v1/auth',
      game: '/api/v1/game',
      health: '/health',
      metrics: config.metrics.enabled ? '/metrics' : null,
      websocket: config.websocket.enabled ? config.websocket.path : null
    },
    documentation: 'https://github.com/skanda890/CodePark'
  })
})

// Mount routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/game', authMiddleware, gameRoutes)
app.use('/health', healthRoutes)

if (config.metrics.enabled) {
  app.use('/metrics', metricsRoutes)
}

// 404 handler
app.use((req, res) => {
  metricsService.recordHttpRequest(req, res, 404)
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    requestId: req.id
  })
})

// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id }, 'Unhandled error')
  metricsService.recordHttpRequest(req, res, err.status || 500)

  const isDevelopment = config.nodeEnv !== 'production'

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    requestId: req.id,
    ...(isDevelopment && { stack: err.stack })
  })
})

// Start server
const server = app.listen(port, async () => {
  logger.info(`
==============================================`)
  logger.info('🚀 CodePark Server v2.0 (BLEEDING EDGE EXPERIMENTAL)')
  logger.info('==============================================')
  logger.info(`Server:        http://localhost:${port}`)
  logger.info(`Environment:   ${config.nodeEnv}`)
  logger.info('API Version:   v1')
  logger.info(
    `WebSocket:     ${config.websocket.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info(
    `Redis:         ${config.redis.enabled ? 'Enabled' : 'In-Memory'}`
  )
  logger.info(
    `Metrics:       ${config.metrics.enabled ? `http://localhost:${config.metrics.port}/metrics` : 'Disabled'}`
  )
  logger.info(
    `Compression:   ${config.compression.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info(
    `Cache:         ${config.cache.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info('⚠️  WARNING:     Using experimental pre-release packages')
  logger.info('==============================================\n')

  // Initialize cache service
  try {
    await cacheService.connect()
    logger.info('✅ Cache service connected')
  } catch (error) {
    logger.warn('⚠️ Cache service unavailable, using in-memory fallback')
  }

  // Initialize WebSocket if enabled
  if (config.websocket.enabled) {
    websocketService.init(server)
    logger.info('✅ WebSocket service initialized')
  }

  // Start metrics server if enabled
  if (config.metrics.enabled) {
    metricsService.startServer()
  }
})

// Centralized shutdown helper
function shutdown (signal, code = 0) {
  logger.info(`${signal} signal received. Starting graceful shutdown...`)

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed')
    logger.info('Cleaning up resources...')

    // Close WebSocket connections
    if (config.websocket.enabled) {
      websocketService.close()
      logger.info('WebSocket connections closed')
    }

    // Disconnect cache
    try {
      await cacheService.disconnect()
      logger.info('Cache service disconnected')
    } catch (error) {
      logger.error({ err: error }, 'Error disconnecting cache')
    }

    logger.info('Shutdown complete')
    process.exit(code)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// CLI Number Guessing Game (only if running in interactive mode)
if (process.stdin.isTTY && process.argv.includes('--game')) {
  startCliGame(() => shutdown('CLI_GAME_END', 0))
}

// Graceful shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM', 0))
process.on('SIGINT', () => shutdown('SIGINT', 0))

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception')
  shutdown('UNCAUGHT_EXCEPTION', 1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Rejection')
  shutdown('UNHANDLED_REJECTION', 1)
})

module.exports = app
