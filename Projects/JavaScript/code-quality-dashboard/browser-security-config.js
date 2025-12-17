// code-quality-dashboard/browser-security-config.js
// ✅ Security configuration for browser-safe code quality dashboard

export const CODE_QUALITY_SECURITY = {
  projectName: 'code-quality-dashboard',
  riskLevel: 'MEDIUM',

  // Data source
  dataSources: {
    type: 'REST_API',
    endpoint: '/api/metrics',
    updateInterval: 300000 // 5 minutes
  },

  // Metrics collection
  metrics: {
    allowedMetrics: [
      'coverage',
      'complexity',
      'duplication',
      'bugs',
      'vulnerabilities'
    ],
    aggregationMethod: 'server-side'
  },

  // Caching
  caching: {
    enabled: true,
    ttl: 600000, // 10 minutes
    strategy: 'LRU'
  },

  // Service Worker for background updates
  backgroundSync: {
    enabled: true,
    syncInterval: 600000
  },

  // Validation
  validation: {
    validateMetricRanges: true,
    rejectOutliers: true
  }
}

export default CODE_QUALITY_SECURITY
