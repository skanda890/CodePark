/**
 * Audit Trail Logger (Feature #23)
 * Logs all actions for compliance and debugging
 */

const crypto = require('crypto')

class AuditLogger {
  constructor (options = {}) {
    this.logs = []
    this.maxLogs = options.maxLogs || 10000
    this.actions = new Map()
  }

  /**
   * Log action
   */
  logAction (userId, action, resource, result, metadata = {}) {
    const log = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      result,
      metadata,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    }

    this.logs.push(log)

    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    const key = `${userId}:${action}`
    if (!this.actions.has(key)) {
      this.actions.set(key, 0)
    }
    this.actions.set(key, this.actions.get(key) + 1)

    return log
  }

  /**
   * Get user activity
   */
  getUserActivity (userId, limit = 100) {
    return this.logs
      .filter((log) => log.userId === userId)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get action history
   */
  getActionHistory (resource, limit = 100) {
    return this.logs
      .filter((log) => log.resource === resource)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get audit report
   */
  getAuditReport (userId = null, startDate = null, endDate = null) {
    let filtered = this.logs

    if (userId) {
      filtered = filtered.filter((log) => log.userId === userId)
    }

    if (startDate) {
      filtered = filtered.filter((log) => log.timestamp >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((log) => log.timestamp <= endDate)
    }

    return {
      totalActions: filtered.length,
      actions: filtered,
      period: { startDate, endDate }
    }
  }
}

module.exports = AuditLogger
