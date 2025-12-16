// backup-manager/browser-security-config.js
// ✅ Security configuration for browser-safe backups

export const BACKUP_SECURITY = {
  projectName: 'backup-manager',
  riskLevel: 'CRITICAL',
  
  // Encryption for backups
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    saltLength: 16,
    iterations: 100000,
    compression: true,
  },

  // File handling
  files: {
    maxBackupSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['json', 'zip'],
    quarantineNewBackups: false,
  },

  // Storage
  storage: {
    dbName: 'BackupDB',
    storeName: 'backups',
    maxStorageSize: 500 * 1024 * 1024, // 500MB (if supported)
  },

  // Download security
  downloads: {
    requiresPassword: true,
    passwordMinLength: 8,
    downloadTimeout: 300000,
  },

  // Restore security
  restore: {
    validateChecksum: true,
    verifyEncryption: true,
    confirmBeforeRestore: true,
  },

  // Compression
  compression: {
    library: 'ZIP.js',
    algorithm: 'deflate',
  }
};

export default BACKUP_SECURITY;
