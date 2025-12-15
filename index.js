const express = require('express')
const compression = require('compression')
const { v4: uuidv4 } = require('uuid')
const logger = require('./config/logger')
const { startCliGame } = require('./games/cli/numberGuessing')
const config = require('./config')
const { version: appVersion } = require('./package.json')

// Middleware
const { rateLimiter, gameRateLimiter } = require('./middleware/rateLimiter')
const { helmetConfig } = require('./middleware/security')
const cors = require('./middleware/cors')
const requestLogger = require('./middleware/requestLogger')
const authMiddleware = require('./middleware/auth')
const cacheMiddleware = require('./middleware/cache')

// Routes
const authRoutes = require('./routes/auth')
const gameRoutes = require('./games/routes/gameRoutes')
const healthRoutes = require('./routes/health')
const metricsRoutes = require('./routes/metrics')
const webhookRoutes = require('./routes/webhooks')

// Services
const metricsService = require('./services/metrics')
const websocketService = require('./services/websocket')
const cacheService = require('./services/cache')

const app = express()
const port = config.port

// Initialize metrics
metricsService.init(app)

// Security: Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by')

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// Security Middleware - Use centralized Helmet config from middleware/security.js
// This ensures consistent CSP and headers across the application
app.use(helmetConfig)

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

// CORS configuration with validated origins
const allowedOrigins = process.env.ALLOWED_ORIGINS || config.allowedOrigin
app.use(cors(allowedOrigins))

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
    name: 'CodePark API - Security Hardened',
    version: appVersion,
    status: 'running',
    message: 'Production-ready with security enhancements',
    features: {
      websocket: config.websocket.enabled,
      authentication: true,
      caching: config.cache.enabled,
      metrics: config.metrics.enabled,
      compression: config.compression.enabled,
      games: true
    },
    endpoints: {
      auth: '/api/v1/auth',
      game: '/api/v1/game',
      health: '/health',
      metrics: config.metrics.enabled ? '/metrics' : null,
      webhooks: '/api/webhooks',
      websocket: config.websocket.enabled ? config.websocket.path : null
    },
    documentation: 'https://github.com/skanda890/CodePark',
    security: 'https://github.com/skanda890/CodePark/blob/main/SECURITY.md'
  })
})

// Mount routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/game', authMiddleware, gameRoutes)
app.use('/health', healthRoutes)
app.use('/api/webhooks', webhookRoutes)

if (config.metrics.enabled) {
  app.use('/metrics', metricsRoutes)
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    requestId: req.id
  })
})

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const requestId = req.id || uuidv4()
  
  // Ensure X-Request-ID header is always set for consistency
  if (!res.getHeader('X-Request-ID')) {
    res.setHeader('X-Request-ID', requestId)
  }
  
  logger.error({ err, requestId }, 'Unhandled error')

  const isDevelopment = config.nodeEnv !== 'production'
  const statusCode = err.status || err.statusCode || 500

  res.status(statusCode).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    requestId: requestId,
    ...(isDevelopment && { stack: err.stack })
  })
})

// Start server
const server = app.listen(port, async () => {
  logger.info(`
==============================================`)
  logger.info(`🚀 CodePark Server v${appVersion} (Security Hardened)`)
  logger.info('==============================================')
  logger.info(`Server:        Running on port ${port}`)
  logger.info(`Environment:   ${config.nodeEnv}`)
  logger.info('API Version:   v1')
  logger.info(
    `WebSocket:     ${config.websocket.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info(
    `Redis:         ${config.redis.enabled ? 'Enabled' : 'In-Memory'}`
  )
  if (config.metrics.enabled) {
    logger.info('Metrics:       Available on /metrics endpoint')
  } else {
    logger.info('Metrics:       Disabled')
  }
  logger.info(
    `Compression:   ${config.compression.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info(
    `Cache:         ${config.cache.enabled ? 'Enabled' : 'Disabled'}`
  )
  logger.info('🎮 Games:       Number Guessing (CLI & API)')
  logger.info('✅ Security:    All dependencies pinned to stable versions')
  logger.info('✅ Webhooks:    Secured with JWT authentication & validation')
  logger.info('==============================================')

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

    // Close WebSocket connections (includes stopping heartbeat timer)
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

    // Close metrics server
    if (config.metrics.enabled) {
      metricsService.close()
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
  startCliGame({
    onSuccess: (attempts, number) => {
      logger.info(`Game won in ${attempts} attempts. Number was ${number}.`)
      shutdown('CLI_GAME_END', 0)
    },
    onError: (error) => {
      logger.error({ err: error }, 'Game error')
      shutdown('CLI_GAME_ERROR', 1)
    }
  })
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
