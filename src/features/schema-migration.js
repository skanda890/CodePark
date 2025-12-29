/**
 * Database Schema Migration Manager (Feature #32)
 * Manages database migrations
 */

const crypto = require('crypto')

class MigrationManager {
  constructor () {
    this.migrations = new Map()
    this.appliedMigrations = []
  }

  /**
   * Register migration
   */
  registerMigration (name, upFn, downFn) {
    this.migrations.set(name, {
      name,
      up: upFn,
      down: downFn,
      timestamp: Date.now()
    })
  }

  /**
   * Apply migration
   */
  async applyMigration (name) {
    const migration = this.migrations.get(name)
    if (!migration) {
      throw new Error(`Migration ${name} not found`)
    }

    if (this.appliedMigrations.includes(name)) {
      throw new Error(`Migration ${name} already applied`)
    }

    try {
      await migration.up()
      this.appliedMigrations.push(name)
      return { success: true, migration: name }
    } catch (error) {
      throw new Error(`Migration ${name} failed: ${error.message}`)
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration (name) {
    const migration = this.migrations.get(name)
    if (!migration) {
      throw new Error(`Migration ${name} not found`)
    }

    if (!this.appliedMigrations.includes(name)) {
      throw new Error(`Migration ${name} not applied`)
    }

    try {
      await migration.down()
      this.appliedMigrations = this.appliedMigrations.filter((m) => m !== name)
      return { success: true, migration: name }
    } catch (error) {
      throw new Error(`Rollback ${name} failed: ${error.message}`)
    }
  }

  /**
   * Get migration status
   */
  getStatus () {
    return {
      total: this.migrations.size,
      applied: this.appliedMigrations.length,
      pending: this.migrations.size - this.appliedMigrations.length,
      migrations: Array.from(this.migrations.keys()).map((name) => ({
        name,
        applied: this.appliedMigrations.includes(name)
      }))
    }
  }
}

module.exports = MigrationManager
