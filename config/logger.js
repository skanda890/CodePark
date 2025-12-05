/**
 * Structured logging with Pino
 * High-performance JSON logger
 */

const pino = require('pino')
const config = require('./index')

const logger = pino({
  level: config.logging.level,
  ...(config.logging.pretty && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:mm:ss',
        ignore: 'pid,hostname'
      }
    }
  })
})

module.exports = logger
