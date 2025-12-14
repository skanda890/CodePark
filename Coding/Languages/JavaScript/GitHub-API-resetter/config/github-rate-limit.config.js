/**
 * GitHub API Rate Limit Configuration
 * Centralized configuration for rate limit monitoring
 */

module.exports = {
  // Rate limit thresholds (in percentages)
  thresholds: {
    warning: 20,      // Warn when below 20% remaining
    critical: 10,     // Critical alert when below 10% remaining
    healthy: 50       // Considered healthy when above 50% remaining
  },

  // Monitoring settings
  monitoring: {
    interval: 5 * 60 * 1000,      // Check every 5 minutes
    pollInterval: 30 * 1000,       // Poll every 30 seconds when waiting for reset
    enableNotifications: true       // Enable alert notifications
  },

  // Optimization strategies
  optimization: {
    useGraphQL: true,              // Prefer GraphQL when possible
    implementETags: true,          // Use conditional requests
    enableCaching: true,           // Cache responses
    batchRequests: true,           // Batch multiple operations
    useMultiToken: false           // Multi-token support (v1.1)
  },

  // Notification configuration
  notifications: {
    slack: {
      enabled: false,              // Not available in v1.0
      webhookUrl: process.env.SLACK_WEBHOOK_URL || null,
      channel: '#alerts',
      events: ['critical', 'exhausted']
    },
    email: {
      enabled: false,              // Not available in v1.0
      provider: 'smtp',            // 'smtp', 'sendgrid', or 'aws-ses'
      recipients: [],
      events: ['critical', 'exhausted']
    },
    console: {
      enabled: true,               // Always enabled in v1.0
      colorOutput: true,
      verbose: false
    }
  },

  // Advanced features
  advanced: {
    enablePrediction: false,       // Rate limit prediction (v1.3)
    enableAIOptimization: false,   // AI recommendations (v1.3)
    enableMetricsExport: false,    // Prometheus metrics (v2.0)
    enableWebDashboard: false      // Web dashboard (v1.2)
  },

  // Performance tuning
  performance: {
    connectionTimeout: 10000,      // 10 second timeout
    requestTimeout: 30000,         // 30 second request timeout
    maxRetries: 3,                 // Max retry attempts
    retryDelay: 1000               // Initial retry delay (exponential backoff)
  },

  // API endpoints (standard GitHub API)
  api: {
    baseUrl: 'https://api.github.com',
    rateLimit: '/rate_limit',
    version: 'v3'
  },

  // Rate limit defaults (typical values)
  // Note: These are defaults. Actual limits may vary.
  rateLimits: {
    rest: {
      core: {
        limit: 5000,               // Authenticated user
        window: 3600               // 1 hour
      },
      search: {
        limit: 30,                 // Search requests
        window: 60                 // 1 minute
      }
    },
    graphql: {
      limit: 5000,                 // GraphQL points
      window: 3600                 // 1 hour
    },
    apps: {
      limit: 15000,                // GitHub Apps get higher limit
      window: 3600
    }
  },

  // Caching configuration
  cache: {
    enabled: true,
    ttl: 5 * 60,                   // 5 minute cache TTL
    strategy: 'memory'             // 'memory' or 'redis' (v1.1)
  },

  // Logging configuration
  logging: {
    enabled: true,
    level: 'info',                 // 'debug', 'info', 'warn', 'error'
    file: null,                    // Log file path (null = console only)
    maxSize: 10 * 1024 * 1024,    // 10MB max log file size
    format: 'json'                 // 'json' or 'text'
  },

  // Database logging (v1.1)
  database: {
    enabled: false,
    provider: 'mongodb',           // 'mongodb', 'postgresql', 'mysql'
    url: process.env.DATABASE_URL || null,
    collection: 'github_rate_limits',
    retentionDays: 90              // Keep data for 90 days
  },

  // Feature flags
  features: {
    multiToken: false,             // v1.1
    notifications: false,          // v1.1
    webDashboard: false,           // v1.2
    githubApp: false,              // v1.2
    aiOptimization: false,         // v1.3
    multiPlatform: false,          // v2.0
    graphqlGenerator: false        // v2.0
  },

  // Experimental settings
  experimental: {
    enableNewParser: false,
    enableCaching: false,
    enableCompression: false
  }
};
