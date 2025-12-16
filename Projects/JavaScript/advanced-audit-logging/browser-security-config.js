// advanced-audit-logging/browser-security-config.js
// ✅ Security configuration for browser-safe audit logging

export const AUDIT_LOGGING_SECURITY = {
  projectName: 'advanced-audit-logging',
  riskLevel: 'HIGH',
  
  // Storage configuration
  storage: {
    dbName: 'AuditLogsDB',
    storeName: 'auditLogs',
    encryptionEnabled: true,
    maxLogSize: 100, // Max logs before cleanup
  },

  // Validation rules
  validation: {
    maxMessageLength: 5000,
    forbiddenPatterns: [
      /require\s*\(/gi,
      /eval\s*\(/gi,
      /process\./gi,
      /__proto__/gi,
    ]
  },

  // Rate limiting
  rateLimit: {
    maxLogsPerMinute: 100,
    windowMs: 60000,
  },

  // API sync configuration
  sync: {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    batchSize: 50,
    endpoint: '/api/audit/logs/batch',
  },

  // Encryption
  encryption: {
    algorithm: 'AES-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
  },

  // Log levels
  logLevels: ['debug', 'info', 'warn', 'error', 'critical'],

  // Audit events to track
  auditEvents: [
    'USER_LOGIN',
    'USER_LOGOUT',
    'PERMISSION_CHANGE',
    'DATA_ACCESS',
    'DATA_MODIFICATION',
    'ERROR_OCCURRED',
    'SECURITY_EVENT',
  ]
};

export const validateAuditLog = (logEntry) => {
  if (!logEntry.timestamp || typeof logEntry.timestamp !== 'number') {
    throw new Error('Invalid timestamp');
  }
  if (!logEntry.level || !AUDIT_LOGGING_SECURITY.logLevels.includes(logEntry.level)) {
    throw new Error('Invalid log level');
  }
  if (!logEntry.message || logEntry.message.length > AUDIT_LOGGING_SECURITY.validation.maxMessageLength) {
    throw new Error('Invalid message length');
  }
  for (const pattern of AUDIT_LOGGING_SECURITY.validation.forbiddenPatterns) {
    if (pattern.test(logEntry.message)) {
      throw new Error('Message contains forbidden patterns');
    }
  }
  return true;
};

export default AUDIT_LOGGING_SECURITY;
