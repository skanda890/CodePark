/**
 * Game Routes
 * Number guessing game (requires authentication)
 */

const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const { gameRateLimiter } = require('../middleware/rateLimiter')
const { getGameOr404, buildGuessResponse } = require('../utils/gameHelpers')
const metricsService = require('../services/metrics')
const websocketService = require('../services/websocket')
const logger = require('../config/logger')
const config = require('../config')

// In-memory games store
const games = new Map()
const GAME_EXPIRY_MS = config.game.expiryMinutes * 60 * 1000
const MAX_GAMES = config.game.maxGames

// Clean up expired games periodically
setInterval(() => {
  const now = Date.now()
  for (const [gameId, data] of games.entries()) {
    if (now - data.createdAt > GAME_EXPIRY_MS) {
      games.delete(gameId)
      logger.debug({ gameId }, 'Cleaned up expired game')
    }
  }
  metricsService.updateActiveGames(games.size)
}, 60 * 1000)

/**
 * GET /api/v1/game/start
 * Start a new game
 */
router.get('/start', gameRateLimiter, (req, res) => {
  try {
    // Check if we've hit the game limit
    if (games.size >= MAX_GAMES) {
      return res.status(503).json({
        error: 'Server capacity reached',
        message: 'Too many active games. Please try again later.',
        activeGames: games.size,
        requestId: req.id
      })
    }

    const gameId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
    const randomNumber = Math.floor(Math.random() * 100) + 1

    // Store game data
    games.set(gameId, {
      target: randomNumber,
      createdAt: Date.now(),
      attempts: 0,
      userId: req.user.userId,
      username: req.user.username
    })

    metricsService.updateActiveGames(games.size)

    logger.info(
      { gameId, username: req.user.username, requestId: req.id },
      'Game started'
    )

    // Broadcast to WebSocket
    if (config.websocket.enabled) {
      websocketService.broadcastToUser(req.user.userId, {
        type: 'game:started',
        gameId,
        message: 'New game started'
      })
    }

    res.json({
      message:
        'Number guessing game started! Guess a number between 1 and 100.',
      gameId,
      expiresIn: `${config.game.expiryMinutes} minutes`,
      hint: 'POST /api/v1/game/check with your guess'
    })
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Error starting game')
    res.status(500).json({
      error: 'Failed to start game',
      requestId: req.id
    })
  }
})

/**
 * POST /api/v1/game/check
 * Check a guess
 */
router.post(
  '/check',
  gameRateLimiter,
  [
    body('gameId')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('gameId is required'),
    body('guess')
      .isInt({ min: 1, max: 100 })
      .withMessage('guess must be between 1 and 100')
  ],
  (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((e) => e.msg),
          requestId: req.id
        })
      }

      const { gameId, guess } = req.body

      // Get game or return 404
      const gameData = getGameOr404(games, gameId, res)
      if (!gameData) return

      // Check if user owns this game
      if (gameData.userId !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only play your own games',
          requestId: req.id
        })
      }

      // Build and send response
      const parsed = parseInt(guess, 10)
      const response = buildGuessResponse(gameData, parsed, gameId, games)

      // Update metrics
      if (response.result === 'correct') {
        metricsService.updateActiveGames(games.size)
      }

      logger.info(
        {
          gameId,
          username: req.user.username,
          guess,
          result: response.result,
          requestId: req.id
        },
        'Guess checked'
      )

      // Broadcast to WebSocket
      if (config.websocket.enabled) {
        websocketService.broadcastToUser(req.user.userId, {
          type: 'game:guess',
          gameId,
          guess,
          result: response.result,
          attempts: response.attempts
        })
      }

      res.json(response)
    } catch (error) {
      logger.error({ err: error, requestId: req.id }, 'Error checking guess')
      res.status(500).json({
        error: 'Failed to check guess',
        requestId: req.id
      })
    }
  }
)

/**
 * GET /api/v1/game/stats
 * Get user's game statistics
 */
router.get('/stats', (req, res) => {
  try {
    const userGames = Array.from(games.values()).filter(
      (game) => game.userId === req.user.userId
    )

    res.json({
      activeGames: userGames.length,
      totalActiveGames: games.size,
      maxGames: MAX_GAMES,
      games: userGames.map((game) => ({
        gameId: Array.from(games.entries()).find(([id, g]) => g === game)?.[0],
        createdAt: game.createdAt,
        attempts: game.attempts
      }))
    })
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Error getting stats')
    res.status(500).json({
      error: 'Failed to get stats',
      requestId: req.id
    })
  }
})

/**
 * DELETE /api/v1/game/:gameId
 * Cancel a game
 */
router.delete('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params
    const gameData = games.get(gameId)

    if (!gameData) {
      return res.status(404).json({
        error: 'Game not found',
        requestId: req.id
      })
    }

    // Check ownership
    if (gameData.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own games',
        requestId: req.id
      })
    }

    games.delete(gameId)
    metricsService.updateActiveGames(games.size)

    logger.info(
      { gameId, username: req.user.username, requestId: req.id },
      'Game cancelled'
    )

    res.json({
      message: 'Game cancelled successfully',
      gameId
    })
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Error cancelling game')
    res.status(500).json({
      error: 'Failed to cancel game',
      requestId: req.id
    })
  }
})

module.exports = router
