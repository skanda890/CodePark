/**
 * GitHub API Rate Limit Configuration
 * 
 * This configuration file defines rate limit thresholds, monitoring settings,
 * and optimization strategies for GitHub API usage.
 * 
 * @module config/github-rate-limit
 */

module.exports = {
  // =========================================================================
  // Rate Limit Tiers
  // =========================================================================
  rateLimits: {
    rest: {
      authenticated: 5000,
      unauthenticated: 60,
      window: '1 hour',
      windowSeconds: 3600,
    },
    graphql: {
      limit: 5000,
      window: '1 hour',
      windowSeconds: 3600,
      costPerQuery: {
        simple: 1,
        moderate: 5,
        complex: 25,
        expensive: 50,
      },
    },
    search: {
      limit: 30,
      window: '1 minute',
      windowSeconds: 60,
    },
  },

  // =========================================================================
  // Alert Thresholds
  // =========================================================================
  thresholds: {
    // Percentage-based thresholds
    healthy: {
      min: 50, // 50% or more remaining = healthy
      level: 'info',
    },
    warning: {
      min: 20,
      max: 49,
      level: 'warning',
      action: 'reduce_api_calls',
    },
    critical: {
      min: 0,
      max: 19,
      level: 'error',
      action: 'halt_and_wait',
    },
    exhausted: {
      min: 0,
      exact: 0,
      level: 'critical',
      action: 'immediate_wait',
    },
  },

  // =========================================================================
  // Monitoring Configuration
  // =========================================================================
  monitoring: {
    // Check interval in minutes
    checkInterval: 5,
    
    // Log level: 'debug', 'info', 'warn', 'error'
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Save monitoring data to file
    saveMetrics: true,
    metricsFile: './logs/github-rate-limit.json',
    
    // Metrics retention in days
    metricsRetentionDays: 7,
    
    // Enable alerts
    enableAlerts: true,
    
    // Alert channels
    alertChannels: {
      console: true,
      email: process.env.ENABLE_EMAIL_ALERTS === 'true',
      slack: process.env.ENABLE_SLACK_ALERTS === 'true',
      webhook: process.env.ENABLE_WEBHOOK_ALERTS === 'true',
    },
  },

  // =========================================================================
  // API Optimization Strategies
  // =========================================================================
  optimization: {
    // Use GraphQL instead of REST
    preferGraphQL: true,
    
    // Enable request caching
    caching: {
      enabled: true,
      ttlSeconds: 300, // 5 minutes
      maxSize: 100, // Maximum cached requests
    },
    
    // Use conditional requests (ETags)
    conditionalRequests: true,
    
    // Batch similar requests
    batchRequests: true,
    batchSize: 10,
    
    // Request queue settings
    queue: {
      enabled: true,
      maxQueueSize: 1000,
      processingRate: 100, // Requests per minute
      priorityLevels: {
        critical: 1,
        high: 2,
        normal: 3,
        low: 4,
      },
    },
  },

  // =========================================================================
  // GraphQL Optimization
  // =========================================================================
  graphql: {
    // Query complexity limits
    complexity: {
      max: 1000,
      warn: 800,
    },
    
    // Pagination settings
    pagination: {
      defaultFirst: 10,
      maxFirst: 100,
      defaultAfter: null,
    },
    
    // Field selection optimization
    selectedFields: {
      repository: ['id', 'name', 'description', 'url'],
      issue: ['id', 'title', 'number', 'state'],
      pullRequest: ['id', 'title', 'number', 'state'],
      commit: ['oid', 'message', 'committedDate'],
    },
  },

  // =========================================================================
  // Retry Strategy
  // =========================================================================
  retry: {
    // Enable automatic retries
    enabled: true,
    
    // Maximum retry attempts
    maxAttempts: 3,
    
    // Exponential backoff settings
    backoff: {
      enabled: true,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      multiplier: 2,
    },
    
    // Retry on specific status codes
    retryOnStatusCodes: [429, 502, 503, 504],
    
    // Don't retry on these status codes
    noRetryOnStatusCodes: [400, 401, 403, 404],
  },

  // =========================================================================
  // Rate Limit Aware Features
  // =========================================================================
  features: {
    // Auto-pause when approaching limit
    autoPause: {
      enabled: true,
      thresholdPercent: 10, // Pause when 10% remaining
    },
    
    // Predictive reset time estimation
    predictiveReset: true,
    
    // Estimate remaining time based on current usage
    estimateRemaining: true,
    
    // Health check status
    healthCheck: {
      enabled: true,
      intervalSeconds: 300,
    },
  },

  // =========================================================================
  // Notification Settings
  // =========================================================================
  notifications: {
    // Email alerts
    email: {
      enabled: false,
      recipients: [],
      events: ['critical', 'exhausted'],
    },
    
    // Slack webhook
    slack: {
      enabled: false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts',
      events: ['critical', 'exhausted'],
    },
    
    // Generic webhook
    webhook: {
      enabled: false,
      url: process.env.ALERT_WEBHOOK_URL,
      events: ['critical', 'exhausted'],
    },
    
    // Console logging
    console: {
      enabled: true,
      verbose: process.env.VERBOSE_LOGGING === 'true',
    },
  },

  // =========================================================================
  // Advanced Settings
  // =========================================================================
  advanced: {
    // Use GitHub Apps (higher rate limits)
    useGitHubApp: false,
    githubAppId: process.env.GITHUB_APP_ID,
    githubAppPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    
    // Multiple authentication tokens for distributed quota
    multipleTokens: {
      enabled: false,
      tokens: [], // Add multiple tokens for round-robin
    },
    
    // Request deduplication
    deduplication: {
      enabled: true,
      windowSeconds: 60,
    },
    
    // Metrics collection
    metrics: {
      enabled: true,
      trackRequestCosts: true,
      trackQueryComplexity: true,
      trackCacheHits: true,
    },
  },

  // =========================================================================
  // API Endpoints Configuration
  // =========================================================================
  endpoints: {
    restApi: 'https://api.github.com',
    graphqlApi: 'https://api.github.com/graphql',
    uploadUrl: 'https://uploads.github.com',
  },

  // =========================================================================
  // Request Headers
  // =========================================================================
  headers: {
    userAgent: 'CodePark-GitHub-Rate-Limit-Manager/1.0',
    acceptVersion: 'application/vnd.github.v3+json',
    timeout: 30000, // 30 seconds
  },

  // =========================================================================
  // Logging Configuration
  // =========================================================================
  logging: {
    // Log file paths
    paths: {
      rateLimitLog: './logs/github-rate-limit.log',
      metricsLog: './logs/github-metrics.json',
      errorLog: './logs/github-errors.log',
    },
    
    // Log rotation settings
    rotation: {
      enabled: true,
      maxSize: '10m',
      maxFiles: 7,
    },
    
    // Log level hierarchy: debug < info < warn < error < critical
    levels: {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      critical: 4,
    },
  },

  // =========================================================================
  // Health Check Configuration
  // =========================================================================
  healthCheck: {
    enabled: true,
    intervalSeconds: 300,
    endpoints: {
      rest: 'https://api.github.com/zen',
      graphql: 'https://api.github.com/graphql',
    },
    timeout: 10000,
  },

  // =========================================================================
  // Validation Rules
  // =========================================================================
  validation: {
    // Minimum token length
    tokenMinLength: 20,
    
    // Maximum requests per batch
    maxBatchSize: 100,
    
    // Maximum query depth
    maxQueryDepth: 10,
    
    // Minimum time between requests (ms)
    minRequestInterval: 0,
  },

  // =========================================================================
  // Performance Tuning
  // =========================================================================
  performance: {
    // Connection pool size
    poolSize: 10,
    
    // Keep-alive timeout (ms)
    keepAliveTimeout: 60000,
    
    // Memory limit for cache (MB)
    cacheMemoryLimit: 100,
    
    // Compression enabled
    compression: true,
  },
};
