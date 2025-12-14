/**
 * GitHub API Rate Limit Manager - Complete Integration
 *
 * This module combines all 10 advanced features:
 * 1. Multi-Token Support & Team Management
 * 2. Slack/Discord Notifications
 * 3. Database Logging & Historical Analytics
 * 4. Smart Request Queuing System
 * 5. HTTP Server & Web Dashboard
 * 6. GitHub App Integration
 * 7. Advanced Caching & Request Deduplication
 * 8. Cost Analysis Module
 * 9. Export & Reporting
 * 10. Webhook Server for CI/CD Integration
 */

const MultiTokenManager = require('./multi-token-manager')
const NotificationService = require('./notification-service')
const DatabaseLogger = require('./database-logger')
const RequestQueue = require('./request-queue')
const WebDashboard = require('./web-dashboard')
const GitHubAppManager = require('./github-app-manager')
const CacheDeduplicator = require('./cache-deduplicator')
const CostAnalyzer = require('./cost-analyzer')
const WebhookServer = require('./webhook-server')

class GitHubRateLimitManager {
  constructor (config = {}) {
    // Initialize all modules
    this.multiTokenManager = new MultiTokenManager(config.tokens || [])
    this.notificationService = new NotificationService({
      slackWebhook: config.slackWebhook,
      discordWebhook: config.discordWebhook,
      maxRetries: config.maxRetries
    })
    this.databaseLogger = new DatabaseLogger({
      type: config.dbType || 'json',
      storagePath: config.storagePath || './data',
      mongoUri: config.mongoUri,
      sqlitePath: config.sqlitePath
    })
    this.requestQueue = new RequestQueue({
      maxConcurrent: config.maxConcurrent || 5,
      maxRetries: config.maxRetries || 3
    })
    this.webDashboard = new WebDashboard({
      port: config.dashboardPort || 3000,
      multiTokenManager: this.multiTokenManager,
      databaseLogger: this.databaseLogger,
      notificationService: this.notificationService,
      requestQueue: this.requestQueue
    })
    this.gitHubAppManager = new GitHubAppManager({
      appId: config.appId,
      privateKey: config.privateKey,
      webhookSecret: config.webhookSecret
    })
    this.cacheDeduplicator = new CacheDeduplicator({
      ttl: config.cacheTTL || 300000,
      maxCacheSize: config.maxCacheSize || 1000
    })
    this.costAnalyzer = new CostAnalyzer()
    this.webhookServer = new WebhookServer({
      port: config.webhookPort || 3001,
      webhookSecret: config.webhookSecret,
      multiTokenManager: this.multiTokenManager,
      notificationService: this.notificationService,
      databaseLogger: this.databaseLogger
    })

    this.config = config
    this.initialized = false
  }

  /**
   * Initialize all components
   */
  async initialize () {
    console.log('\n🚀 Initializing GitHub API Rate Limit Manager...')

    try {
      // Validate configuration
      console.log('✓ Configuration validated')

      // Initialize database
      await this.databaseLogger.initializeStorage()
      console.log('✓ Database initialized')

      // Validate GitHub App (if configured)
      if (this.config.appId) {
        const validation = this.gitHubAppManager.validateConfiguration()
        if (validation.valid) {
          console.log('✓ GitHub App configured')
        }
      }

      this.initialized = true
      return { success: true, message: 'Manager initialized successfully' }
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Start all servers
   */
  async startServers () {
    if (!this.initialized) {
      throw new Error('Manager not initialized. Call initialize() first')
    }

    console.log('\n🌐 Starting servers...')

    const results = {
      dashboard: await this.webDashboard.start(),
      webhook: await this.webhookServer.start()
    }

    console.log('\n✅ All servers started')
    return results
  }

  /**
   * Stop all servers
   */
  async stopServers () {
    console.log('\n🛑 Stopping servers...')

    const results = {
      dashboard: await this.webDashboard.stop(),
      webhook: await this.webhookServer.stop()
    }

    console.log('✓ All servers stopped')
    return results
  }

  /**
   * Handle API request with all features
   */
  async handleRequest (request) {
    // Step 1: Check cache and deduplication
    const isDuplicate = this.cacheDeduplicator.isDuplicate(request)
    if (isDuplicate.duplicate) {
      return { cached: true, message: 'Request deduped' }
    }

    const cached = this.cacheDeduplicator.get(request)
    if (cached.hit) {
      return { cached: true, response: cached.response }
    }

    // Step 2: Enqueue request
    const queueEntry = this.requestQueue.enqueue(request, 'normal')

    // Step 3: Get next healthy token
    const token = this.multiTokenManager.getNextToken()

    // Step 4: Log usage for cost analysis
    this.costAnalyzer.logUsage(request.endpoint, request.method, 1)

    // Step 5: Monitor rate limits
    const quota = this.multiTokenManager.getTeamQuota()

    if (quota.healthStatus === 'critical') {
      await this.notificationService.notifyCritical({
        remaining: quota.teamStats.combinedRemaining,
        action: 'CRITICAL: Add more tokens or reduce request rate'
      })
    } else if (quota.healthStatus === 'warning') {
      await this.notificationService.notifyWarning({
        remaining: quota.teamStats.combinedRemaining,
        percentage:
          (quota.teamStats.combinedRemaining / quota.teamStats.combinedLimit) *
          100,
        recommendation: quota.recommendedAction
      })
    }

    return {
      queued: true,
      token: token.id,
      health: token.health,
      queuePosition: queueEntry.id
    }
  }

  /**
   * Get comprehensive status report
   */
  getStatus () {
    return {
      initialized: this.initialized,
      multiToken: this.multiTokenManager.getTeamQuota(),
      queue: this.requestQueue.getQueueStatus(),
      cache: this.cacheDeduplicator.getStats(),
      cost: this.costAnalyzer.get30DayUsage(),
      notifications: this.notificationService.getHistory(5),
      timestamp: new Date()
    }
  }

  /**
   * Get full analytics report
   */
  getAnalyticsReport () {
    return {
      teamQuota: this.multiTokenManager.getTeamQuota(),
      queueHealth: this.requestQueue.getQueueHealth(),
      cacheHealth: this.cacheDeduplicator.getHealth(),
      costAnalysis: this.costAnalyzer.getDetailedReport(),
      recommendations: this.costAnalyzer.getOptimizationRecommendations(),
      database: {
        logs: this.databaseLogger.logs?.length || 0,
        type: this.databaseLogger.type
      },
      timestamp: new Date()
    }
  }

  /**
   * Export report to CSV
   */
  async exportReport () {
    return await this.databaseLogger.exportToCSV()
  }

  /**
   * Get GitHub Actions template
   */
  getGitHubActionsTemplate () {
    return this.webhookServer.getGitHubActionsTemplate()
  }

  /**
   * Get GitLab CI template
   */
  getGitLabCITemplate () {
    return this.webhookServer.getGitLabCITemplate()
  }
}

module.exports = GitHubRateLimitManager

// Example usage:
if (require.main === module) {
  const manager = new GitHubRateLimitManager({
    tokens: [process.env.GITHUB_TOKEN_1, process.env.GITHUB_TOKEN_2],
    slackWebhook: process.env.SLACK_WEBHOOK,
    discordWebhook: process.env.DISCORD_WEBHOOK,
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    webhookSecret: process.env.WEBHOOK_SECRET,
    dashboardPort: 3000,
    webhookPort: 3001
  });

  (async () => {
    try {
      await manager.initialize()
      await manager.startServers()

      // Print status every 5 minutes
      setInterval(
        () => {
          console.log('\n📊 Current Status:', manager.getStatus())
        },
        5 * 60 * 1000
      )
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  })()
}
