/**
 * Log Aggregation Service
 * Centralized logging with multi-transport support and structured logging
 * @version 1.0.0
 */

const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

class LogAggregationService extends EventEmitter {
  constructor (options = {}) {
    super()
    this.level = options.level || 'info'
    this.transports = []
    this.formatter = options.formatter || this.defaultFormatter
    this.maxBufferSize = options.maxBufferSize || 1000
    this.logBuffer = []
    this.stats = {
      total: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0
    }

    this.levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }
  }

  /**
   * Add console transport
   * @param {object} options - Transport options
   */
  addConsoleTransport (options = {}) {
    this.transports.push({
      type: 'console',
      format: options.format || 'text',
      colorize: options.colorize !== false
    })
  }

  /**
   * Add file transport
   * @param {string} filename - Log file path
   * @param {object} options - Transport options
   */
  addFileTransport (filename, options = {}) {
    const directory = path.dirname(filename)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }

    this.transports.push({
      type: 'file',
      filename,
      format: options.format || 'json',
      maxSize: options.maxSize || 10485760 // 10MB
    })
  }

  /**
   * Add HTTP transport for external logging service
   * @param {string} endpoint - HTTP endpoint
   * @param {object} options - Transport options
   */
  addHttpTransport (endpoint, options = {}) {
    this.transports.push({
      type: 'http',
      endpoint,
      method: options.method || 'POST',
      timeout: options.timeout || 5000,
      headers: options.headers || {}
    })
  }

  /**
   * Filter log based on level
   * @private
   */
  shouldLog (level) {
    return this.levels[level] >= this.levels[this.level]
  }

  /**
   * Default log formatter
   * @private
   */
  defaultFormatter (log) {
    return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.meta ? ` ${JSON.stringify(log.meta)}` : ''}`
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} meta - Additional metadata
   */
  async log (level, message, meta = {}) {
    if (!this.shouldLog(level)) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      pid: process.pid
    }

    // Update stats
    this.stats.total += 1
    this.stats[level] += 1

    // Add to buffer
    this.logBuffer.push(logEntry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }

    // Send to transports
    for (const transport of this.transports) {
      await this.sendToTransport(transport, logEntry)
    }

    this.emit('log', logEntry)
  }

  /**
   * Send log to transport
   * @private
   */
  async sendToTransport (transport, logEntry) {
    try {
      switch (transport.type) {
        case 'console':
          this.logToConsole(transport, logEntry)
          break
        case 'file':
          await this.logToFile(transport, logEntry)
          break
        case 'http':
          await this.logToHttp(transport, logEntry)
          break
      }
    } catch (error) {
      console.error('Transport error:', error)
    }
  }

  /**
   * Log to console
   * @private
   */
  logToConsole (transport, logEntry) {
    const message =
      transport.format === 'json'
        ? JSON.stringify(logEntry)
        : this.formatter(logEntry)

    const colorCodes = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m' // magenta
    }

    const reset = '\x1b[0m'
    const color = transport.colorize ? colorCodes[logEntry.level] : ''

    const output = transport.colorize ? `${color}${message}${reset}` : message
    console[logEntry.level === 'fatal' ? 'error' : logEntry.level]?.(output) ||
      console.log(output)
  }

  /**
   * Log to file
   * @private
   */
  async logToFile (transport, logEntry) {
    const message =
      transport.format === 'json'
        ? JSON.stringify(logEntry)
        : this.formatter(logEntry)

    return new Promise((resolve, reject) => {
      fs.appendFile(transport.filename, `${message}\n`, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  /**
   * Log to HTTP endpoint
   * @private
   */
  async logToHttp (transport, logEntry) {
    try {
      // Using built-in https/http module
      const https = require('https')
      const http = require('http')
      const url = require('url')

      const parsedUrl = new URL(transport.endpoint)
      const protocol = parsedUrl.protocol === 'https:' ? https : http

      const options = {
        method: transport.method,
        timeout: transport.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...transport.headers
        }
      }

      return new Promise((resolve, reject) => {
        const req = protocol.request(parsedUrl, options, (res) => {
          res.on('end', resolve)
          res.on('error', reject)
        })

        req.on('error', reject)
        req.write(JSON.stringify(logEntry))
        req.end()
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Convenience methods
   */
  debug (message, meta) {
    return this.log('debug', message, meta)
  }

  info (message, meta) {
    return this.log('info', message, meta)
  }

  warn (message, meta) {
    return this.log('warn', message, meta)
  }

  error (message, meta) {
    return this.log('error', message, meta)
  }

  fatal (message, meta) {
    return this.log('fatal', message, meta)
  }

  /**
   * Get recent logs
   * @param {number} count - Number of logs to return
   */
  getRecentLogs (count = 100) {
    return this.logBuffer.slice(-count)
  }

  /**
   * Get log statistics
   */
  getStats () {
    return {
      ...this.stats,
      bufferSize: this.logBuffer.length,
      transports: this.transports.length
    }
  }

  /**
   * Clear log buffer
   */
  clearBuffer () {
    this.logBuffer = []
  }

  /**
   * Express middleware for request logging
   */
  middleware () {
    return (req, res, next) => {
      const start = Date.now()

      res.on('finish', () => {
        const duration = Date.now() - start
        const level = res.statusCode >= 400 ? 'warn' : 'info'

        this.log(level, `${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        })
      })

      next()
    }
  }
}

module.exports = LogAggregationService
