// games/browser-security-config.js
// ✅ Security configuration for browser-safe games

export const GAMES_SECURITY = {
  projectName: 'games',
  riskLevel: 'LOW',

  // State encryption
  state: {
    encryptionEnabled: true,
    algorithm: 'AES-GCM',
    checksumValidation: true
  },

  // Local storage
  storage: {
    dbName: 'GamesDB',
    storeName: 'gameState',
    encryptionEnabled: true
  },

  // Cheat detection
  cheatDetection: {
    enabled: true,
    checkScore: true,
    checkProgress: true,
    checkAchievements: true
  },

  // Multiplayer validation (if applicable)
  multiplayer: {
    enabled: false,
    validateMoves: false,
    antiCheat: false
  },

  // Performance
  performance: {
    enableWebWorkers: true,
    fps: 60
  }
}

export default GAMES_SECURITY
