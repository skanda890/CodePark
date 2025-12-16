// github-integration/browser-security-config.js
// ✅ Security configuration for browser-safe GitHub integration

export const GITHUB_INTEGRATION_SECURITY = {
  projectName: 'github-integration',
  riskLevel: 'CRITICAL',
  
  // OAuth configuration
  oauth: {
    provider: 'GitHub',
    scope: ['user:email', 'repo'],
    responseType: 'code',
    csrfProtection: true,
  },

  // Token storage
  tokenStorage: {
    type: 'SecureStorage',
    encryption: 'AES-GCM',
    neverInLocalStorage: true,
  },

  // Session management
  session: {
    httpOnly: true,
    sameSite: 'Strict',
    secure: true,
    maxAge: 86400000, // 24 hours
  },

  // API proxying
  apiProxy: {
    enabled: true,
    endpoint: '/api/github',
    addTokenHeader: true,
  },

  // State verification
  stateVerification: {
    enabled: true,
    algorithm: 'HMAC-SHA256',
  },

  // Permissions
  permissions: {
    strictScopes: true,
    minimumPrivilege: true,
  }
};

export default GITHUB_INTEGRATION_SECURITY;
