/**
 * Database Logger for GitHub API Rate Limit Manager
 *
 * Features:
 * - JSON file storage (zero dependencies default)
 * - Optional MongoDB support
 * - Optional SQLite support
 * - Automatic historical logging
 * - Trend analysis engine
 * - Peak usage detection
 * - CSV export functionality
 */

const fs = require('fs')
const path = require('path')

class DatabaseLogger {
  constructor (config = {}) {
    this.type = config.type || 'json' // 'json', 'mongodb', 'sqlite'
    this.storagePath = config.storagePath || './data'
    this.logFile = path.join(this.storagePath, 'rate-limit-logs.json')
    this.mongoUri = config.mongoUri
    this.sqliteDb = config.sqlitePath
    this.mongoClient = null
    this.sqliteDb = null
    this.logs = []
    this.maxLogSize = config.maxLogSize || 10000

    this.initializeStorage()
  }

  /**
   * Initialize storage based on type
   */
  async initializeStorage () {
    if (this.type === 'json') {
      this.initializeJsonStorage()
    } else if (this.type === 'mongodb') {
      await this.initializeMongoDb()
    } else if (this.type === 'sqlite') {
      await this.initializeSqlite()
    }
  }

  /**
   * Initialize JSON file storage
   */
  initializeJsonStorage () {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }

    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, JSON.stringify({ logs: [] }, null, 2))
    }

    try {
      const data = fs.readFileSync(this.logFile, 'utf8')
      const parsed = JSON.parse(data)
      this.logs = parsed.logs || []
    } catch (error) {
      console.error('Error loading JSON logs:', error)
      this.logs = []
    }
  }

  /**
   * Initialize MongoDB connection
   */
  async initializeMongoDb () {
    try {
      // Note: Requires 'mongodb' package to be installed
      const MongoClient = require('mongodb').MongoClient
      this.mongoClient = new MongoClient(this.mongoUri)
      await this.mongoClient.connect()
      this.db = this.mongoClient.db('github_rate_limit')
      await this.db.collection('logs').createIndex({ timestamp: 1 })
      await this.db.collection('logs').createIndex({ tokenId: 1 })
    } catch (error) {
      console.error('MongoDB initialization failed:', error)
      throw error
    }
  }

  /**
   * Initialize SQLite connection
   */
  async initializeSqlite () {
    try {
      // Note: Requires 'sqlite3' package to be installed
      const sqlite3 = require('sqlite3')
      this.sqlite = new sqlite3.Database(this.sqliteDb)

      this.sqlite.run(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME,
          tokenId INTEGER,
          remaining INTEGER,
          limit INTEGER,
          percentageUsed REAL,
          reset DATETIME,
          requestCount INTEGER,
          errorCount INTEGER,
          health REAL,
          data TEXT
        )
      `)

      this.sqlite.run(
        'CREATE INDEX IF NOT EXISTS idx_timestamp ON logs(timestamp)'
      )
      this.sqlite.run(
        'CREATE INDEX IF NOT EXISTS idx_tokenId ON logs(tokenId)'
      )
    } catch (error) {
      console.error('SQLite initialization failed:', error)
      throw error
    }
  }

  /**
   * Log rate limit data
   */
  async log (data) {
    const logEntry = {
      timestamp: new Date(),
      ...data
    }

    if (this.type === 'json') {
      return this.logToJson(logEntry)
    } else if (this.type === 'mongodb') {
      return this.logToMongoDB(logEntry)
    } else if (this.type === 'sqlite') {
      return this.logToSqlite(logEntry)
    }
  }

  /**
   * Log to JSON file
   */
  logToJson (logEntry) {
    this.logs.push(logEntry)

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize)
    }

    this.saveJsonLogs()
    return { success: true, logged: true }
  }

  /**
   * Save JSON logs to file
   */
  saveJsonLogs () {
    try {
      fs.writeFileSync(
        this.logFile,
        JSON.stringify({ logs: this.logs }, null, 2)
      )
    } catch (error) {
      console.error('Error saving JSON logs:', error)
    }
  }

  /**
   * Log to MongoDB
   */
  async logToMongoDB (logEntry) {
    try {
      const collection = this.db.collection('logs')
      const result = await collection.insertOne(logEntry)
      return { success: true, insertedId: result.insertedId }
    } catch (error) {
      console.error('Error logging to MongoDB:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Log to SQLite
   */
  async logToSqlite (logEntry) {
    return new Promise((resolve) => {
      const stmt = this.sqlite.prepare(`
        INSERT INTO logs (timestamp, tokenId, remaining, limit, percentageUsed, reset, 
                         requestCount, errorCount, health, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(
        logEntry.timestamp,
        logEntry.tokenId,
        logEntry.remaining,
        logEntry.limit,
        logEntry.percentageUsed,
        logEntry.reset,
        logEntry.requestCount,
        logEntry.errorCount,
        logEntry.health,
        JSON.stringify(logEntry),
        function (err) {
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true, insertedId: this.lastID })
          }
        }
      )

      stmt.finalize()
    })
  }

  /**
   * Get logs for analysis
   */
  async getLogs (options = {}) {
    const { limit = 100 } = options

    if (this.type === 'json') {
      return this.getJsonLogs(options)
    } else if (this.type === 'mongodb') {
      return this.getMongoDBLogs(options)
    } else if (this.type === 'sqlite') {
      return this.getSqliteLogs(options)
    }
  }

  /**
   * Get logs from JSON
   */
  getJsonLogs (options) {
    let filtered = [...this.logs]

    if (options.startDate) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) >= options.startDate
      )
    }
    if (options.endDate) {
      filtered = filtered.filter(
        (l) => new Date(l.timestamp) <= options.endDate
      )
    }
    if (options.tokenId !== undefined) {
      filtered = filtered.filter((l) => l.tokenId === options.tokenId)
    }

    return filtered.slice(-options.limit)
  }

  /**
   * Trend analysis engine
   */
  async analyzeTrends (days = 7) {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    const logs = await this.getLogs({ startDate, endDate, limit: 10000 })

    if (logs.length === 0) {
      return { message: 'No data available for trend analysis' }
    }

    // Group by day
    const dailyStats = {}
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = {
          logs: [],
          totalRequests: 0,
          totalErrors: 0,
          avgRemaining: 0
        }
      }
      dailyStats[date].logs.push(log)
    })

    // Calculate daily metrics
    const trends = {}
    Object.entries(dailyStats).forEach(([date, stat]) => {
      const remaining = stat.logs.map((l) => l.remaining)
      const requests = stat.logs.reduce(
        (sum, l) => sum + (l.requestCount || 0),
        0
      )
      const errors = stat.logs.reduce((sum, l) => sum + (l.errorCount || 0), 0)

      trends[date] = {
        avgRemaining: Math.round(
          remaining.reduce((a, b) => a + b) / remaining.length
        ),
        minRemaining: Math.min(...remaining),
        maxRemaining: Math.max(...remaining),
        requestCount: requests,
        errorCount: errors,
        logs: stat.logs.length
      }
    })

    return {
      period: { start: startDate, end: endDate },
      days,
      trends,
      summary: this.calculateTrendSummary(trends)
    }
  }

  /**
   * Calculate trend summary
   */
  calculateTrendSummary (trends) {
    const values = Object.values(trends)
    const avgRemaining = Math.round(
      values.reduce((sum, v) => sum + v.avgRemaining, 0) / values.length
    )
    const totalRequests = values.reduce((sum, v) => sum + v.requestCount, 0)
    const totalErrors = values.reduce((sum, v) => sum + v.errorCount, 0)

    return {
      avgRemaining,
      totalRequests,
      totalErrors,
      daysAnalyzed: values.length,
      errorRate:
        totalRequests > 0
          ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%'
          : '0%'
    }
  }

  /**
   * Peak usage detection
   */
  async detectPeakUsage (days = 7, threshold = 100) {
    const analysis = await this.analyzeTrends(days)
    const peaks = []

    Object.entries(analysis.trends).forEach(([date, stats]) => {
      if (stats.requestCount > threshold) {
        peaks.push({
          date,
          requestCount: stats.requestCount,
          errorCount: stats.errorCount,
          avgRemaining: stats.avgRemaining
        })
      }
    })

    return {
      threshold,
      peaksDetected: peaks.length,
      peaks: peaks.sort((a, b) => b.requestCount - a.requestCount),
      recommendation:
        peaks.length > 0
          ? 'Consider adding more tokens during peak hours'
          : 'Usage is within normal limits'
    }
  }

  /**
   * Export to CSV
   */
  async exportToCSV (options = {}) {
    const logs = await this.getLogs(options)
    const csvPath = path.join(
      this.storagePath,
      `rate-limit-export-${Date.now()}.csv`
    )

    const headers = [
      'Timestamp',
      'Token ID',
      'Remaining',
      'Limit',
      'Percentage Used',
      'Health',
      'Requests',
      'Errors'
    ]
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.tokenId || 'N/A',
      log.remaining || 0,
      log.limit || 0,
      (log.percentageUsed || 0).toFixed(2) + '%',
      (log.health || 0).toFixed(2) + '%',
      log.requestCount || 0,
      log.errorCount || 0
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n')

    fs.writeFileSync(csvPath, csvContent)
    return { success: true, file: csvPath, rows: rows.length }
  }

  /**
   * Get MongoDB logs
   */
  async getMongoDBLogs (options) {
    const collection = this.db.collection('logs')
    const query = {}

    if (options.startDate) {
      query.timestamp = { $gte: options.startDate }
    }
    if (options.endDate) {
      query.timestamp = { ...query.timestamp, $lte: options.endDate }
    }
    if (options.tokenId !== undefined) {
      query.tokenId = options.tokenId
    }

    return await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit)
      .toArray()
  }

  /**
   * Get SQLite logs
   */
  async getSqliteLogs (options) {
    return new Promise((resolve) => {
      let query = 'SELECT * FROM logs WHERE 1=1'
      const params = []

      if (options.startDate) {
        query += ' AND timestamp >= ?'
        params.push(options.startDate)
      }
      if (options.endDate) {
        query += ' AND timestamp <= ?'
        params.push(options.endDate)
      }
      if (options.tokenId !== undefined) {
        query += ' AND tokenId = ?'
        params.push(options.tokenId)
      }

      query += ' ORDER BY timestamp DESC LIMIT ?'
      params.push(options.limit)

      this.sqlite.all(query, params, (err, rows) => {
        resolve(err ? [] : rows)
      })
    })
  }

  /**
   * Cleanup old logs
   */
  async cleanupOldLogs (daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    if (this.type === 'json') {
      this.logs = this.logs.filter((l) => new Date(l.timestamp) >= cutoffDate)
      this.saveJsonLogs()
    } else if (this.type === 'mongodb') {
      const collection = this.db.collection('logs')
      await collection.deleteMany({ timestamp: { $lt: cutoffDate } })
    } else if (this.type === 'sqlite') {
      return new Promise((resolve) => {
        this.sqlite.run(
          'DELETE FROM logs WHERE timestamp < ?',
          [cutoffDate],
          (err) => {
            resolve({ success: !err, error: err?.message })
          }
        )
      })
    }

    return { success: true, cleaned: true }
  }
}

module.exports = DatabaseLogger
