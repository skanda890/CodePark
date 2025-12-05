const logger = require('../../config/logger')

function getGameOr404 (games, gameId, res) {
  const gameData = games.get(gameId)

  if (!gameData) {
    res.status(404).json({
      error: 'Game not found',
      message: 'This game does not exist or has expired',
      gameId
    })
    return null
  }

  return gameData
}

function buildGuessResponse (gameData, guess, gameId, games) {
  gameData.attempts++

  if (guess === gameData.target) {
    games.delete(gameId)

    logger.info({ gameId, attempts: gameData.attempts }, 'Game won')

    return {
      result: 'correct',
      attempts: gameData.attempts,
      message: `Congratulations! You guessed it in ${gameData.attempts} attempt(s)!`,
      number: gameData.target
    }
  } else if (guess < gameData.target) {
    return {
      result: 'too_low',
      attempts: gameData.attempts,
      hint: 'Try a higher number'
    }
  } else {
    return {
      result: 'too_high',
      attempts: gameData.attempts,
      hint: 'Try a lower number'
    }
  }
}

function isValidGuess (guess, min = 1, max = 100) {
  const n = Number(guess)
  return Number.isInteger(n) && n >= min && n <= max
}

function calculateStats (games, userId) {
  const userGames = Array.from(games.values()).filter(
    (game) => game.userId === userId
  )

  return {
    activeGames: userGames.length,
    totalAttempts: userGames.reduce((sum, game) => sum + game.attempts, 0),
    averageAttempts:
      userGames.length > 0
        ? (
            userGames.reduce((sum, game) => sum + game.attempts, 0) /
            userGames.length
          ).toFixed(2)
        : 0
  }
}

function generateRandomNumber (min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isGameExpired (gameData, expiryMs) {
  return Date.now() - gameData.createdAt > expiryMs
}

function cleanupExpiredGames (games, expiryMs) {
  let cleaned = 0
  const now = Date.now()

  for (const [gameId, data] of games.entries()) {
    if (now - data.createdAt > expiryMs) {
      games.delete(gameId)
      cleaned++
      logger.debug({ gameId }, 'Cleaned up expired game')
    }
  }

  return cleaned
}

module.exports = {
  getGameOr404,
  buildGuessResponse,
  isValidGuess,
  calculateStats,
  generateRandomNumber,
  isGameExpired,
  cleanupExpiredGames
}
