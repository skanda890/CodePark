/**
 * Audit logging system with cryptographic verification
 * Phase 2 Security Implementation
 */

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const { EventEmitter } = require('events')

class AuditLogger extends EventEmitter {
  constructor (options = {}) {
    super()
    this.logDir = options.logDir || './logs/audit'
    this.buffer = []
    this.bufferSize = options.bufferSize || 100
    this.flushInterval = options.flushInterval || 5000
    this.retentionDays = options.retentionDays || 90
    this.signingKey = options.signingKey || crypto.randomBytes(32)

    this.initializeStorage()
    this.startFlushSchedule()
    this.startCleanupSchedule()
  }

  async initializeStorage () {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create audit log directory:', error)
    }
  }

  log (event, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      metadata,
      signature: this.computeSignature({ event, metadata })
    }

    this.buffer.push(entry)
    this.emit('audit', entry)

    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  computeSignature (data) {
    return crypto
      .createHmac('sha256', this.signingKey)
      .update(JSON.stringify(data))
      .digest('hex')
  }

  async flush () {
    if (this.buffer.length === 0) return

    const entries = this.buffer.splice(0, this.buffer.length)
    const date = new Date().toISOString().split('T')[0]
    const filename = `${date}.jsonl`
    const filepath = path.join(this.logDir, filename)

    try {
      const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n'
      await fs.appendFile(filepath, lines)
    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      this.buffer.unshift(...entries)
    }
  }

  startFlushSchedule () {
    setInterval(() => this.flush(), this.flushInterval)
  }

  startCleanupSchedule () {
    setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000)
  }

  async cleanup () {
    try {
      const files = await fs.readdir(this.logDir)
      const now = Date.now()
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000

      for (const file of files) {
        const filepath = path.join(this.logDir, file)
        const stats = await fs.stat(filepath)
        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filepath)
        }
      }
    } catch (error) {
      console.error('Audit log cleanup failed:', error)
    }
  }

  logAuthentication (userId, success, ip, metadata = {}) {
    this.log('AUTHENTICATION', { userId, success, ip, ...metadata })
  }

  logAuthorization (userId, resource, action, granted, ip) {
    this.log('AUTHORIZATION', { userId, resource, action, granted, ip })
  }

  logAdminAction (userId, action, resource, changes) {
    this.log('ADMIN_ACTION', { userId, action, resource, changes })
  }

  logSecurityEvent (eventType, severity, description, metadata = {}) {
    this.log('SECURITY_EVENT', {
      eventType,
      severity,
      description,
      ...metadata
    })
  }

  redact (value) {
    if (typeof value !== 'string' || value.length <= 8) return '[REDACTED]'
    return value.substring(0, 4) + '***' + value.substring(value.length - 4)
  }

  async getStats () {
    try {
      const files = await fs.readdir(this.logDir)
      const totalSize = (
        await Promise.all(files.map((f) => fs.stat(path.join(this.logDir, f))))
      ).reduce((sum, stat) => sum + stat.size, 0)

      return {
        logFiles: files.length,
        bufferSize: this.buffer.length,
        totalStorageSize: totalSize,
        storageUsageGB: (totalSize / 1024 / 1024 / 1024).toFixed(2)
      }
    } catch (error) {
      return { error: error.message }
    }
  }
}

module.exports = AuditLogger
