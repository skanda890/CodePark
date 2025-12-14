# GitHub API Rate Limit Manager - Advanced Features

**Version**: 2.0 | **Status**: Enterprise-Ready | **Last Updated**: December 2025

## Complete Feature Set

This document details all 10 advanced features integrated into the GitHub API Rate Limit Manager.

---

## 1️⃣ Multi-Token Support & Team Management

### Features
- Manage 2+ GitHub tokens simultaneously
- Health-based automatic token rotation
- Per-token statistics and monitoring
- Team quota aggregation
- Failure detection and recovery

### Module: `src/multi-token-manager.js`

### Usage

```javascript
const MultiTokenManager = require('./src/multi-token-manager');

const manager = new MultiTokenManager([
  'ghp_token1...',
  'ghp_token2...',
  'ghp_token3...'
]);

// Get next healthy token
const token = manager.getNextToken();
// { token: 'ghp_...', id: 1, health: 95 }

// Get team statistics
const quota = manager.getTeamQuota();
// {
//   teamStats: { totalRequests: 1500, averageHealth: 85 },
//   healthStatus: 'healthy',
//   recommendedAction: 'OK: Team quota is healthy'
// }
```

### Key Methods
- `getNextToken()` - Get next healthy token with auto-rotation
- `getTeamQuota()` - Get aggregated team statistics
- `getAllTokenStats()` - Get per-token details
- `calculateHealth()` - Calculate token health
- `getTeamRecommendation()` - Get team-level recommendations

---

## 2️⃣ Slack/Discord Notifications

### Features
- Real-time alerts when rate limits drop
- Slack webhook integration
- Discord webhook integration
- Notification deduplication (5-minute window)
- Exponential backoff retry (up to 3 attempts)
- Multiple alert types (warning, critical, reset, rotation, error)

### Module: `src/notification-service.js`

### Configuration

```javascript
const NotificationService = require('./src/notification-service');

const notifications = new NotificationService({
  slackWebhook: 'https://hooks.slack.com/services/...',
  discordWebhook: 'https://discord.com/api/webhooks/...',
  deduplicationWindow: 300000, // 5 minutes
  maxRetries: 3,
  baseBackoffMs: 1000
});
```

### Usage

```javascript
// Send warning
await notifications.notifyWarning({
  remaining: 500,
  limit: 5000,
  percentage: 10,
  recommendation: 'Add more tokens'
});

// Send critical alert
await notifications.notifyCritical({
  remaining: 100,
  action: 'CRITICAL: Insufficient quota'
});

// Send reset notification
await notifications.notifyReset({
  apiType: 'REST (Core)',
  limit: 5000
});
```

### Alert Types
| Type | Use Case | Emoji |
|------|----------|-------|
| **warning** | Rate limit below 25% | ⚠️ |
| **critical** | Rate limit below 5% | 🚨 |
| **reset** | Rate limit has reset | ✅ |
| **rotation** | Token rotation occurred | 🔄 |
| **error** | API error occurred | ❌ |

---

## 3️⃣ Database Logging & Historical Analytics

### Features
- JSON file storage (zero dependencies default)
- Optional MongoDB support
- Optional SQLite support
- Automatic historical logging
- Trend analysis engine
- Peak usage detection
- CSV export functionality

### Module: `src/database-logger.js`

### Configuration

```javascript
const DatabaseLogger = require('./src/database-logger');

// JSON storage (default)
const logger = new DatabaseLogger({ type: 'json' });

// MongoDB
const logger = new DatabaseLogger({
  type: 'mongodb',
  mongoUri: 'mongodb://localhost:27017'
});

// SQLite
const logger = new DatabaseLogger({
  type: 'sqlite',
  sqlitePath: './data/rate-limit.db'
});
```

### Usage

```javascript
// Log usage
await logger.log({
  tokenId: 1,
  remaining: 4500,
  limit: 5000,
  requestCount: 500,
  errorCount: 2,
  health: 90
});

// Analyze trends
const trends = await logger.analyzeTrends(7);
// Returns daily statistics for past 7 days

// Detect peak usage
const peaks = await logger.detectPeakUsage(7, 100);

// Export to CSV
const result = await logger.exportToCSV();
// { success: true, file: './data/rate-limit-export-*.csv' }
```

---

## 4️⃣ Smart Request Queuing System

### Features
- Priority-based request queuing (4 levels: critical, high, normal, low)
- Automatic rate limit detection
- Exponential backoff retry (up to 3 attempts)
- Concurrent request management (configurable)
- Queue pause/resume functionality
- Per-token queue management
- Queue health monitoring

### Module: `src/request-queue.js`

### Usage

```javascript
const RequestQueue = require('./src/request-queue');

const queue = new RequestQueue({
  maxConcurrent: 5,
  maxRetries: 3,
  baseBackoffMs: 1000
});

// Enqueue request
const entry = queue.enqueue({
  endpoint: '/user',
  method: 'GET',
  tokenId: 1
}, 'high'); // priority: critical, high, normal, low

// Process request
await queue.processRequest(entry, async (request) => {
  // Your API call here
  return await makeGitHubCall(request);
});

// Pause/resume
queue.pause();
queue.resume();

// Get health
const health = queue.getQueueHealth();
// { successRate: '98.5%', status: 'healthy', avgWaitTime: '125ms' }
```

---

## 5️⃣ HTTP Server & Web Dashboard

### Features
- Express.js-based server (uses native HTTP)
- Real-time rate limit visualization
- REST API endpoints for monitoring
- Health status indicators (color-coded)
- Auto-refresh every 60 seconds
- Responsive design
- Interactive health monitoring

### Module: `src/web-dashboard.js`

### Configuration

```javascript
const WebDashboard = require('./src/web-dashboard');

const dashboard = new WebDashboard({
  port: 3000,
  host: 'localhost',
  multiTokenManager: manager,
  databaseLogger: logger,
  notificationService: notifications,
  requestQueue: queue
});

await dashboard.start();
// Dashboard running at http://localhost:3000
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web dashboard UI |
| `/api/status` | GET | Team quota status |
| `/api/tokens` | GET | All tokens statistics |
| `/api/queue` | GET | Queue status |
| `/api/health` | GET | System health |
| `/api/history` | GET | Historical logs |
| `/health` | GET | Kubernetes health check |

---

## 6️⃣ GitHub App Integration

### Features
- JWT token generation
- Installation token management
- Automatic token refresh with TTL caching
- Webhook signature verification
- Higher rate limits support (10,000/hour vs 5,000)
- Organization and Enterprise support

### Module: `src/github-app-manager.js`

### Configuration

```javascript
const GitHubAppManager = require('./src/github-app-manager');

const appManager = new GitHubAppManager({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhookSecret: process.env.WEBHOOK_SECRET
});
```

### Usage

```javascript
// Generate JWT
const jwt = appManager.generateJWT();

// Get installation token
const token = await appManager.getInstallationToken(12345);
// Token is cached and automatically refreshed

// Verify webhook
const isValid = appManager.verifyWebhookSignature(payload, signature);

// Get rate limit info
const limits = appManager.getRateLimitInfo();
// { appType: 'GitHub App', limits: { core: 10000, search: 30 } }
```

### Rate Limits (GitHub App)
| Limit Type | Rate |
|------------|------|
| **Core API** | 10,000 requests/hour |
| **Search API** | 30 requests/minute |
| **GraphQL** | 5,000 points/hour |

---

## 7️⃣ Advanced Caching & Request Deduplication

### Features
- TTL-based cache expiration (configurable)
- ETag validation for conditional requests
- Request deduplication (SHA-256 hashing)
- Time-window deduplication (5 seconds default)
- Max size enforcement with LRU eviction
- Cache and deduplication statistics

### Module: `src/cache-deduplicator.js`

### Usage

```javascript
const CacheDeduplicator = require('./src/cache-deduplicator');

const cache = new CacheDeduplicator({
  ttl: 300000,        // 5 minutes
  maxCacheSize: 1000,
  deduplicationTime: 5000 // 5 seconds
});

// Check for duplicate
const isDup = cache.isDuplicate(request);
if (isDup.duplicate) return 'Request already in flight';

// Set cache
cache.set(request, response);

// Get from cache
const cached = cache.get(request);
if (cached.hit) return cached.response;

// Get statistics
const stats = cache.getStats();
// { hits: 1500, misses: 234, hitRate: '86.5%' }
```

---

## 8️⃣ Cost Analysis Module

### Features
- Per-endpoint cost calculation
- GraphQL vs REST efficiency comparison
- 7-day and 30-day usage summaries
- Daily average calculation
- 30-day usage forecasting
- Estimated days until rate limit exhaustion
- Cost optimization recommendations

### Module: `src/cost-analyzer.js`

### Usage

```javascript
const CostAnalyzer = require('./src/cost-analyzer');

const analyzer = new CostAnalyzer();

// Log usage
analyzer.logUsage('/user', 'GET', 1);

// Get 7-day summary
const summary7 = analyzer.get7DayUsage();
// { totalRequests: 2500, totalCost: 2500, dailyAverage: 357 }

// Get 30-day summary
const summary30 = analyzer.get30DayUsage();

// Forecast usage
const forecast = analyzer.forecast30Days();
// { projectedRequests: 15000, projectedCost: 15000 }

// Estimate days until limit
const estimate = analyzer.estimateDaysUntilLimit(1000, 50);
// { daysRemaining: 20, exhaustionDate: Date }

// Get recommendations
const recommendations = analyzer.getOptimizationRecommendations();
```

---

## 9️⃣ Export & Reporting

### Features
- HTML report generation with styling
- CSV export (comma-separated values)
- JSON export (structured data)
- Excel-compatible format
- Summary metrics display
- Detailed recommendation inclusion
- Auto-cleanup with configurable retention

### Usage

```javascript
// Export to CSV
const result = await logger.exportToCSV();
// { success: true, file: '...', rows: 500 }

// Get detailed report
const report = analyzer.getDetailedReport();
// Returns comprehensive analysis with recommendations

// Get analytics
const analytics = manager.getAnalyticsReport();
```

---

## 🔟 Webhook Server for CI/CD Integration

### Features
- GitHub event webhook handling
- Pre-deployment rate limit checks
- Webhook signature verification
- Health check endpoints
- GitHub Actions integration template
- GitLab CI integration template
- Prevents deployments with insufficient quota

### Module: `src/webhook-server.js`

### Configuration

```javascript
const WebhookServer = require('./src/webhook-server');

const webhook = new WebhookServer({
  port: 3001,
  webhookSecret: process.env.WEBHOOK_SECRET,
  multiTokenManager: manager,
  notificationService: notifications,
  databaseLogger: logger
});

await webhook.start();
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook` | POST | GitHub webhook receiver |
| `/pre-deploy-check` | POST | Pre-deployment quota check |
| `/health` | GET | Server health |
| `/deployment-history` | GET | Deployment history |

### GitHub Actions Integration

```yaml
# .github/workflows/pre-deploy.yml
name: Pre-Deployment Rate Limit Check

on: [deployment]

jobs:
  check-quota:
    runs-on: ubuntu-latest
    steps:
      - name: Check Rate Limit
        run: |
          curl -X POST http://localhost:3001/pre-deploy-check \
            -d '{"minQuota": 500}'
```

### GitLab CI Integration

```yaml
pre_deploy_check:
  stage: deploy
  script:
    - |
      curl -X POST http://localhost:3001/pre-deploy-check \
        -d '{"minQuota": 500}'
```

---

## 🚀 Complete Integration Example

### Setup

```javascript
const Manager = require('./src/index');

const manager = new Manager({
  tokens: [
    process.env.GITHUB_TOKEN_1,
    process.env.GITHUB_TOKEN_2
  ],
  slackWebhook: process.env.SLACK_WEBHOOK,
  discordWebhook: process.env.DISCORD_WEBHOOK,
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhookSecret: process.env.WEBHOOK_SECRET,
  dashboardPort: 3000,
  webhookPort: 3001,
  dbType: 'json'
});

// Initialize
await manager.initialize();

// Start servers
await manager.startServers();

// Make request
const result = await manager.handleRequest({
  endpoint: '/user',
  method: 'GET'
});

// Get status
const status = manager.getStatus();

// Get analytics
const analytics = manager.getAnalyticsReport();

// Export report
const exported = await manager.exportReport();
```

---

## 📊 Monitoring & Alerting

### Automatic Alerts Triggered By
- Rate limit < 25% → **Warning** notification
- Rate limit < 5% → **Critical** notification
- Token becomes unhealthy → **Rotation** notification
- API error → **Error** notification
- Rate limit reset → **Reset** notification

### Health Status Levels
| Status | Condition | Color |
|--------|-----------|-------|
| **Healthy** | Average health > 70% | 🟢 Green |
| **Warning** | Average health 40-70% | 🟡 Yellow |
| **Critical** | Average health < 40% | 🔴 Red |

---

## 🔧 Configuration Best Practices

1. **Multi-Token Setup**: Use 3-5 tokens for high-volume operations
2. **Cache Strategy**: Set TTL based on data freshness requirements
3. **Queue Tuning**: Adjust `maxConcurrent` based on your system
4. **Notification**: Enable both Slack and Discord for redundancy
5. **Database**: Use SQLite for medium scale, MongoDB for enterprise
6. **Monitoring**: Check dashboard every 5 minutes in production
7. **Webhooks**: Always verify signature for security

---

## 📈 Performance Tips

- ✅ Use GraphQL for batch operations (30-50% cost savings)
- ✅ Implement ETag-based caching (10-20% request reduction)
- ✅ Enable request deduplication (avoid duplicate API calls)
- ✅ Use priority queuing for critical requests
- ✅ Monitor trends and adjust token count accordingly
- ✅ Set up pre-deployment quota checks

---

## 🛠️ Troubleshooting

### High Memory Usage
- Reduce `maxCacheSize`
- Reduce `maxHistorySize`
- Run cleanup: `await logger.cleanupOldLogs(7)`

### Missed Notifications
- Check webhook URLs are valid
- Verify signature is correct
- Check notification history

### Queue Buildup
- Increase `maxConcurrent`
- Add more tokens
- Check for rate limit exhaustion

---

## 📚 Related Documentation

- Main README: [README.md](./README.md)
- Implementation Guide: [GITHUB-RATE-LIMIT-IMPLEMENTATION.md](./docs/GITHUB-RATE-LIMIT-IMPLEMENTATION.md)
- GitHub API Docs: [https://docs.github.com/en/rest](https://docs.github.com/en/rest)

---

**Made with ❤️ for developers who need enterprise-grade rate limit management**
