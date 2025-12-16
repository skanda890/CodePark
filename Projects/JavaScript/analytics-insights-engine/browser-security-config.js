// analytics-insights-engine/browser-security-config.js
// ✅ Security configuration for browser-safe analytics

export const ANALYTICS_SECURITY = {
  projectName: 'analytics-insights-engine',
  riskLevel: 'HIGH',
  
  // Database abstraction (REST API)
  database: {
    type: 'REST_API',
    endpoint: '/api/analytics',
    queryValidation: true,
  },

  // Query restrictions
  queryLimits: {
    maxQueryLength: 5000,
    maxResultsPerQuery: 10000,
    maxConcurrentQueries: 5,
    timeout: 30000,
  },

  // Data aggregation
  aggregation: {
    performedClientSide: false, // Server does aggregation
    cachingEnabled: true,
    cacheTTL: 300000, // 5 minutes
  },

  // Validation patterns
  validation: {
    forbiddenSQLPatterns: [
      /drop\s+table/gi,
      /delete\s+from/gi,
      /update.*set/gi,
      /insert.*into/gi,
      /;\s*$/g,
    ]
  },

  // Service Worker for background sync
  serviceWorker: {
    enabled: true,
    syncTag: 'analytics-sync',
  }
};

export default ANALYTICS_SECURITY;
