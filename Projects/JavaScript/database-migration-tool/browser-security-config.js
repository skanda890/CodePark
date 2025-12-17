// database-migration-tool/browser-security-config.js
// ✅ Security configuration for browser-safe database migrations

export const DATABASE_MIGRATION_SECURITY = {
  projectName: 'database-migration-tool',
  riskLevel: 'CRITICAL',

  // Execution model
  executionModel: {
    generationOnly: true,
    executedOnBackend: true,
    noClientSideExecution: true
  },

  // Migration generation
  generation: {
    supportedDialects: ['MySQL', 'PostgreSQL', 'SQLite', 'MongoDB'],
    validationStrict: true
  },

  // SQL validation
  sqlValidation: {
    forbiddenStatements: ['DROP DATABASE', 'DROP TABLE', 'TRUNCATE'],
    forbiddenPatterns: [/drop\s+database/gi, /drop\s+table/gi, /truncate/gi]
  },

  // Preview mode
  preview: {
    enabled: true,
    showDryRun: true,
    rollbackSupport: true
  },

  // Audit trail
  auditTrail: {
    enabled: true,
    logAllMigrations: true,
    signMigrations: true
  }
}

export default DATABASE_MIGRATION_SECURITY
