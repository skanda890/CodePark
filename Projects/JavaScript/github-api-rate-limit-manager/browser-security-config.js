// github-api-rate-limit-manager/browser-security-config.js
// ✅ Security configuration for browser-safe GitHub API management

export const GITHUB_RATE_LIMIT_SECURITY = {
  projectName: 'github-api-rate-limit-manager',
  riskLevel: 'HIGH',
  
  // API proxy
  apiProxy: {
    enabled: true,
    endpoint: '/api/github/rate-limit',
    backendHandlesAuth: true,
  },

  // Rate limiting
  rateLimit: {
    trackPerRepository: true,
    alertThreshold: 0.2, // 20% of limit
    resetHours: 1,
  },

  // Caching
  caching: {
    enabled: true,
    ttl: 60000, // 1 minute
  },

  // Token security
  tokens: {
    neverStoredLocally: true,
    handledByBackend: true,
  },

  // Monitoring
  monitoring: {
    trackUsage: true,
    alertHighUsage: true,
  }
};

export default GITHUB_RATE_LIMIT_SECURITY;
