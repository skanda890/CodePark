/**
 * Game Configuration
 * Centralized configuration for all game-related settings
 * 
 * @module games/config/gameConfig
 */

module.exports = {
  // Number Guessing Game Configuration
  numberGuessing: {
    // Range for number generation
    min: 1,
    max: 100,
    
    // Game expiration (in minutes)
    expiryMinutes: 30,
    
    // Maximum concurrent games per server
    maxGames: 1000,
    
    // Cleanup interval (in seconds)
    cleanupIntervalSeconds: 60,
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  // Future game configurations can be added here
  // Example:
  // sudoku: {
  //   difficulty: 'medium',
  //   maxGames: 500,
  //   expiryMinutes: 60
  // },
  
  // General game settings
  general: {
    // Enable WebSocket notifications
    enableWebSocket: true,
    
    // Enable game metrics
    enableMetrics: true,
    
    // Enable game statistics tracking
    enableStats: true,
    
    // Maximum attempts before auto-fail (0 = unlimited)
    maxAttempts: 0,
    
    // Enable game leaderboards (future)
    enableLeaderboards: false
  }
};