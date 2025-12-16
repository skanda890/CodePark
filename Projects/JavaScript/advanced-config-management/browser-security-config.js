// advanced-config-management/browser-security-config.js
// ✅ Security configuration for browser-safe config management

export const CONFIG_MANAGEMENT_SECURITY = {
  projectName: 'advanced-config-management',
  riskLevel: 'CRITICAL',
  
  // Storage configuration
  storage: {
    dbName: 'ConfigDB',
    storeName: 'config',
    encryptionEnabled: true,
  },

  // Configuration passing method
  configTransport: {
    method: 'postMessage', // Use iframe postMessage for secure passing
    trusted_origins: ['https://trusted.example.com'],
    encryption: 'AES-GCM',
  },

  // Validation
  validation: {
    requiredFields: ['apiKey', 'dbUrl', 'jwtSecret'],
    forbiddenPatterns: [
      /require\s*\(/gi,
      /eval\s*\(/gi,
      /process\./gi,
      /__proto__/gi,
    ]
  },

  // Config access control
  accessControl: {
    restrictEnvironmentVariables: true,
    hideSecretsInLogs: true,
    maxConfigAge: 3600000, // 1 hour
  },

  // Security headers for config transfer
  transferHeaders: {
    'X-Config-Encrypted': 'true',
    'X-Config-Signed': 'true',
    'X-Config-Checksum': 'SHA-256',
  }
};

export const validateConfigStructure = (config) => {
  for (const field of CONFIG_MANAGEMENT_SECURITY.validation.requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required config field: ${field}`);
    }
  }
  return true;
};

export default CONFIG_MANAGEMENT_SECURITY;
