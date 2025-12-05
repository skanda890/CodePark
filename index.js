const express = require('express')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const { startCliGame } = require('./cliGame')

const app = express()
const port = process.env.PORT || 3000

// Security Constants
const MAX_GAMES = 1000 // Prevent memory exhaustion
const GAME_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_REQUEST_SIZE = '100kb'

// Security Middleware - Helmet for HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
)

// Rate limiting - Prevent DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

const gameRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit game creation to 20 per 5 minutes
  message: 'Too many games started, please try again later.'
})

app.use(limiter)

// Body parsing middleware with size limits
app.use(express.json({ limit: MAX_REQUEST_SIZE }))
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }))

// CORS configuration (adjust origins as needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`)
  next()
})

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CodePark API - BLEEDING EDGE EXPERIMENTAL',
    version: '1.0.0',
    status: 'running',
    warning: 'This server uses experimental pre-release packages',
    endpoints: {
      health: '/health',
      startGame: 'GET /game/guess',
      checkGuess: 'POST /game/check'
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeGames: games.size,
    uptime: process.uptime()
  })
})

// Number guessing game with memory management
const games = new Map()

// Clean up expired games periodically
setInterval(() => {
  const now = Date.now()
  for (const [gameId, data] of games.entries()) {
    if (now - data.createdAt > GAME_EXPIRY_MS) {
      games.delete(gameId)
      console.log(`Cleaned up expired game: ${gameId}`)
    }
  }
}, 60 * 1000) // Run cleanup every minute

app.get('/game/guess', gameRateLimiter, (req, res) => {
  // Check if we've hit the game limit
  if (games.size >= MAX_GAMES) {
    return res.status(503).json({
      error: 'Server capacity reached. Please try again later.',
      activeGames: games.size
    })
  }

  const gameId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
  const randomNumber = Math.floor(Math.random() * 100) + 1

  // Store game data with metadata
  games.set(gameId, {
    target: randomNumber,
    createdAt: Date.now(),
    attempts: 0
  })

  res.json({
    message:
      'Number guessing game started! Try to guess a number between 1 and 100.',
    gameId,
    hint: 'POST /game/check with {"gameId":"<gameId>","guess": number} to check your guess',
    expiresIn: `${GAME_EXPIRY_MS / 60000} minutes`
  })
})

app.post(
  '/game/check',
  [
    body('gameId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('gameId must be a non-empty string'),
    body('guess')
      .isInt({ min: 1, max: 100 })
      .withMessage('guess must be an integer between 1 and 100')
  ],
  (req, res) => {
    // Validate input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => e.msg)
      })
    }

    const { gameId, guess } = req.body

    const gameData = games.get(gameId)
    if (!gameData) {
      return res.status(404).json({
        error: 'Game not found or already finished'
      })
    }

    // Increment attempt counter
    gameData.attempts++

    const target = gameData.target
    const parsed = parseInt(guess, 10)

    if (parsed < target) {
      return res.json({
        result: 'too low',
        attempts: gameData.attempts
      })
    } else if (parsed > target) {
      return res.json({
        result: 'too high',
        attempts: gameData.attempts
      })
    } else {
      games.delete(gameId)
      return res.json({
        result: 'correct',
        attempts: gameData.attempts,
        message: `Congratulations! You guessed it in ${gameData.attempts} attempt(s)!`
      })
    }
  }
)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  })
})

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack)

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production'

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  })
})

// Start server
const server = app.listen(port, () => {
  console.log('\n==============================================')
  console.log('🚀 CodePark Server (BLEEDING EDGE EXPERIMENTAL)')
  console.log('==============================================')
  console.log(`Server running: http://localhost:${port}`)
  console.log(`Health check:   http://localhost:${port}/health`)
  console.log(`Environment:    ${process.env.NODE_ENV || 'development'}`)
  console.log(`Max Games:      ${MAX_GAMES}`)
  console.log('⚠️  WARNING: Using experimental pre-release packages')
  console.log('==============================================\n')
})

// Centralized shutdown helper
function shutdown (signal, code = 0) {
  console.log(`\n${signal} signal received. Starting graceful shutdown...`)

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed')
    console.log('Cleaning up resources...')

    // Clear all games
    games.clear()
    console.log('Game data cleared')

    console.log('Shutdown complete')
    process.exit(code)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
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
  console.error('Uncaught Exception:', err)
  shutdown('UNCAUGHT_EXCEPTION', 1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  shutdown('UNHANDLED_REJECTION', 1)
})

module.exports = app
