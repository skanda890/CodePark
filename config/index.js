/**
 * Centralized configuration
 * All environment variables and app settings
 */

require('dotenv').config();

module.exports = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '100kb',

  // Security
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '', // Optional separate refresh secret
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  gameRateLimit: {
    windowMs: parseInt(process.env.GAME_RATE_LIMIT_WINDOW_MS, 10) || 5 * 60 * 1000,
    max: parseInt(process.env.GAME_RATE_LIMIT_MAX, 10) || 20
  },

  // Game Settings
  game: {
    maxGames: parseInt(process.env.MAX_CONCURRENT_GAMES, 10) || 1000,
    expiryMinutes: parseInt(process.env.GAME_EXPIRY_MINUTES, 10) || 10
  },

  // Redis
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },

  // WebSocket
  websocket: {
    enabled: process.env.WS_ENABLED !== 'false',
    path: process.env.WS_PATH || '/ws',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL, 10) || 30000
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    port: parseInt(process.env.METRICS_PORT, 10) || 9090
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.LOG_PRETTY === 'true'
  },

  // API
  api: {
    version: process.env.API_VERSION || 'v1'
  },

  // Compression
  compression: {
    enabled: process.env.COMPRESSION_ENABLED !== 'false',
    level: parseInt(process.env.COMPRESSION_LEVEL, 10) || 6,
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD, 10) || 1024
  },

  // Cache
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300
  }
};
