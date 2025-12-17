const cron = require('node-cron')
const fs = require('fs').promises
const path = require('path')

class BackupManager {
  constructor (options = {}) {
    this.schedule = options.schedule || '0 2 * * *' // Daily at 2 AM
    this.retention = options.retention || 30 // days
    this.backupPath = options.backupPath || './backups'
    this.incremental = options.incremental || false
    this.db = options.db
    this.backups = []
  }

  start () {
    cron.schedule(this.schedule, () => this.performBackup())
    console.log(`Backup scheduled: ${this.schedule}`)
  }

  async performBackup () {
    try {
      const timestamp = new Date().toISOString()
      const backupName = `backup_${timestamp.replace(/[:.]/g, '-')}.json`
      const backupPath = path.join(this.backupPath, backupName)

      // Create backup directory
      await fs.mkdir(this.backupPath, { recursive: true })

      // Perform backup
      const data = await this.db.export()
      await fs.writeFile(backupPath, JSON.stringify(data, null, 2))

      this.backups.push({
        name: backupName,
        timestamp: new Date(),
        size: data.length
      })

      // Cleanup old backups
      await this.cleanupOldBackups()

      console.log(`Backup completed: ${backupName}`)
    } catch (error) {
      console.error(`Backup failed: ${error.message}`)
    }
  }

  async cleanupOldBackups () {
    const now = Date.now()
    const retentionMs = this.retention * 24 * 60 * 60 * 1000

    for (const backup of this.backups) {
      if (now - backup.timestamp > retentionMs) {
        await fs.unlink(path.join(this.backupPath, backup.name))
        this.backups = this.backups.filter((b) => b.name !== backup.name)
      }
    }
  }

  async restore (backupName) {
    const backupPath = path.join(this.backupPath, backupName)
    const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'))
    await this.db.import(data)
    console.log(`Backup restored: ${backupName}`)
  }

  getBackups () {
    return this.backups
  }
}

module.exports = BackupManager
