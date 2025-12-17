class MigrationRunner {
  constructor(options = {}) {
    this.migrationsPath = options.migrationsPath || './migrations';
    this.db = options.db;
    this.appliedMigrations = [];
  }

  async up() {
    const files = await this.getMigrationFiles();
    for (const file of files) {
      if (!this.appliedMigrations.includes(file)) {
        try {
          const migration = require(`${this.migrationsPath}/${file}`);
          await migration.up(this.db);
          this.appliedMigrations.push(file);
          console.log(`Migration completed: ${file}`);
        } catch (error) {
          console.error(`Migration failed: ${file} - ${error.message}`);
          throw error;
        }
      }
    }
  }

  async down(steps = 1) {
    const migrationsToRollback = this.appliedMigrations.slice(-steps);
    for (const file of migrationsToRollback.reverse()) {
      try {
        const migration = require(`${this.migrationsPath}/${file}`);
        await migration.down(this.db);
        this.appliedMigrations.pop();
        console.log(`Migration rolled back: ${file}`);
      } catch (error) {
        console.error(`Rollback failed: ${file} - ${error.message}`);
        throw error;
      }
    }
  }

  async status() {
    const files = await this.getMigrationFiles();
    return {
      pending: files.filter(f => !this.appliedMigrations.includes(f)),
      applied: this.appliedMigrations,
      total: files.length
    };
  }

  async getMigrationFiles() {
    // Mock implementation
    return [
      '001_initial_schema.js',
      '002_add_users_table.js',
      '003_add_indexes.js'
    ];
  }
}

module.exports = MigrationRunner;
