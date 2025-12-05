/**
 * Rate Limiter Middleware
 * Redis-backed with in-memory fallback
 */

const rateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const Redis = require('ioredis')
const config = require('../config')
const logger = require('../config/logger')

let redisClient = null

// Try to connect to Redis for rate limiting
if (config.redis.enabled) {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db
    })

    redisClient.on('connect', () => {
      logger.info('Redis rate limiter store connected')
    })

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis rate limiter error')
    })
  } catch (error) {
    logger.warn(
      { err: error },
      'Redis rate limiter unavailable, using memory store'
    )
    redisClient = null
  }
}

// General API rate limiter
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:general:'
    })
  })
})

// Game-specific rate limiter
const gameRateLimiter = rateLimit({
  windowMs: config.gameRateLimit.windowMs,
  max: config.gameRateLimit.max,
  message: 'Too many game requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:game:'
    })
  })
})

module.exports = {
  rateLimiter,
  gameRateLimiter
}
