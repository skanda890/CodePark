/**
 * Game Helper Functions
 * Reusable game logic utilities
 * 
 * @module games/utils/gameHelpers
 */

const logger = require('../../config/logger');

/**
 * Get game or return 404 response
 * @param {Map} games - Games map
 * @param {string} gameId - Game ID to find
 * @param {Object} res - Express response object
 * @returns {Object|null} Game data or null if 404 sent
 */
function getGameOr404(games, gameId, res) {
  const gameData = games.get(gameId);

  if (!gameData) {
    res.status(404).json({
      error: 'Game not found',
      message: 'This game does not exist or has expired',
      gameId
    });
    return null;
  }

  return gameData;
}

/**
 * Build guess response
 * @param {Object} gameData - Game data object
 * @param {number} guess - User's guess
 * @param {string} gameId - Game ID
 * @param {Map} games - Games map
 * @returns {Object} Response object
 */
function buildGuessResponse(gameData, guess, gameId, games) {
  gameData.attempts++;

  if (guess === gameData.target) {
    // Correct guess - remove game
    games.delete(gameId);

    logger.info({ gameId, attempts: gameData.attempts }, 'Game won');

    return {
      result: 'correct',
      attempts: gameData.attempts,
      message: `Congratulations! You guessed it in ${gameData.attempts} attempt(s)!`,
      number: gameData.target
    };
  } else if (guess < gameData.target) {
    return {
      result: 'too_low',
      attempts: gameData.attempts,
      hint: 'Try a higher number'
    };
  } else {
    return {
      result: 'too_high',
      attempts: gameData.attempts,
      hint: 'Try a lower number'
    };
  }
}

/**
 * Validate guess within range
 * @param {number} guess - Guess to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Is valid
 */
function isValidGuess(guess, min = 1, max = 100) {
  return Number.isInteger(guess) && guess >= min && guess <= max;
}

/**
 * Calculate game statistics
 * @param {Map} games - Games map
 * @param {string} userId - User ID
 * @returns {Object} Statistics
 */
function calculateStats(games, userId) {
  const userGames = Array.from(games.values()).filter(
    (game) => game.userId === userId
  );

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
  };
}

/**
 * Generate random number within range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number
 */
function generateRandomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if game has expired
 * @param {Object} gameData - Game data object
 * @param {number} expiryMs - Expiry time in milliseconds
 * @returns {boolean} Is expired
 */
function isGameExpired(gameData, expiryMs) {
  return Date.now() - gameData.createdAt > expiryMs;
}

/**
 * Clean up expired games
 * @param {Map} games - Games map
 * @param {number} expiryMs - Expiry time in milliseconds
 * @returns {number} Number of games cleaned up
 */
function cleanupExpiredGames(games, expiryMs) {
  let cleaned = 0;
  const now = Date.now();
  
  for (const [gameId, data] of games.entries()) {
    if (now - data.createdAt > expiryMs) {
      games.delete(gameId);
      cleaned++;
      logger.debug({ gameId }, 'Cleaned up expired game');
    }
  }
  
  return cleaned;
}

module.exports = {
  getGameOr404,
  buildGuessResponse,
  isValidGuess,
  calculateStats,
  generateRandomNumber,
  isGameExpired,
  cleanupExpiredGames
};