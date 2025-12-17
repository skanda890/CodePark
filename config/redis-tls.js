const redis = require('redis')
const fs = require('fs')
const path = require('path')

// Logger stub - replace with your logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
}

const createRedisClient = async () => {
  try {
    // Validate environment
    const redisHost = process.env.REDIS_HOST || 'localhost'
    const redisPort = parseInt(process.env.REDIS_PORT || '6379')
    const redisPassword = process.env.REDIS_PASSWORD
    const redisTLS = process.env.REDIS_TLS === 'true'

    const options = {
      host: redisHost,
      port: redisPort,
      db: 0,
      password: redisPassword,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis connection refused')
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry exceeded timeout')
        }
        if (options.attempt > 10) {
          return undefined
        }
        return Math.min(options.attempt * 100, 3000)
      }
    }

    // Configure TLS if enabled
    if (redisTLS) {
      const caCertPath = process.env.REDIS_CA_CERT || '/etc/redis/ca.crt'
      const clientCertPath =
        process.env.REDIS_CLIENT_CERT || '/etc/redis/client.crt'
      const clientKeyPath =
        process.env.REDIS_CLIENT_KEY || '/etc/redis/client.key'

      // Check if certificate files exist
      if (
        !fs.existsSync(caCertPath) ||
        !fs.existsSync(clientCertPath) ||
        !fs.existsSync(clientKeyPath)
      ) {
        logger.warn(
          'Redis TLS certificate files not found, falling back to non-TLS connection'
        )
      } else {
        options.tls = {
          ca: [fs.readFileSync(caCertPath, 'utf8')],
          cert: fs.readFileSync(clientCertPath, 'utf8'),
          key: fs.readFileSync(clientKeyPath, 'utf8'),
          rejectUnauthorized: true
        }
        logger.info('Redis TLS enabled with certificate-based authentication')
      }
    }

    const client = redis.createClient(options)

    client.on('error', (err) => {
      logger.error('Redis client error:', err)
    })

    client.on('connect', () => {
      logger.info('Connected to Redis')
    })

    client.on('ready', () => {
      logger.info('Redis client ready for commands')
    })

    // Health check interval
    const healthCheck = setInterval(() => {
      client.ping((err, reply) => {
        if (err) {
          logger.error('Redis health check failed:', err)
        } else {
          logger.info('Redis health check passed')
        }
      })
    }, 30000) // Every 30 seconds

    client.on('close', () => {
      clearInterval(healthCheck)
      logger.info('Redis connection closed')
    })

    return client
  } catch (error) {
    logger.error('Failed to create Redis client:', error)
    throw error
  }
}

module.exports = { createRedisClient }
