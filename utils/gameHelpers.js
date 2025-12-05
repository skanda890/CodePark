/**
 * Game helper functions
 * Extracted from index.js to reduce complexity
 */

/**
 * Get game data or return 404
 * @param {Map} games - The games Map
 * @param {string} gameId - The game ID to find
 * @param {Object} res - Express response object
 * @returns {Object|null} Game data or null if not found
 */
function getGameOr404(games, gameId, res) {
  const gameData = games.get(gameId);
  if (!gameData) {
    res.status(404).json({ error: 'Game not found or already finished' });
    return null;
  }
  return gameData;
}

/**
 * Build response based on guess result
 * @param {Object} gameData - The game data object
 * @param {number} parsed - The parsed guess value
 * @param {string} gameId - The game ID
 * @param {Map} games - The games Map
 * @returns {Object} Response object
 */
function buildGuessResponse(gameData, parsed, gameId, games) {
  gameData.attempts++;

  if (parsed < gameData.target) {
    return {
      result: 'too low',
      attempts: gameData.attempts
    };
  }
  
  if (parsed > gameData.target) {
    return {
      result: 'too high',
      attempts: gameData.attempts
    };
  }

  // Correct guess - clean up and return success
  games.delete(gameId);
  return {
    result: 'correct',
    attempts: gameData.attempts,
    message: `Congratulations! You guessed it in ${gameData.attempts} attempt(s)!`
  };
}

module.exports = {
  getGameOr404,
  buildGuessResponse
};
