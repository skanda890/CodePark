# GitHub API Rate Limit Reset Utility

## Project Overview

This project provides a comprehensive utility for monitoring, managing, and optimizing GitHub API rate limits. It's designed to help developers working with the CodePark project manage their API quota efficiently across REST, GraphQL, and Search APIs.

### Key Features

✅ **Real-time Rate Limit Monitoring**

- Check current rate limit status for REST, GraphQL, and Search APIs
- Display remaining requests and reset times
- Identify nearly exhausted limits automatically

✅ **Continuous Monitoring**

- Monitor rate limits every 5 minutes (configurable)
- Log trends and patterns
- Generate alerts for critical conditions

✅ **Smart Wait Feature**

- Automatically wait for rate limit reset
- Check every 30 seconds
- Resume operations when limits are healthy

✅ **Reset Recommendations**

- Provide actionable recommendations
- Show estimated reset times
- Suggest optimization strategies

✅ **Multiple Output Formats**

- Human-readable formatted output
- JSON output for programmatic consumption
- Verbose logging for debugging

✅ **API Optimization Guide**

- GraphQL best practices
- Caching strategies
- Request batching techniques
- Conditional request usage

---

## Quick Start

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/skanda890/CodePark.git
   cd CodePark
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up GitHub token**

   ```bash
   # Option 1: Create .env file
   echo "GITHUB_TOKEN=ghp_your_token_here" > .env

   # Option 2: Export environment variable
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

### Generate GitHub Personal Access Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Select scopes: `repo`, `read:org`
4. Copy and save the token
5. Set it in your environment

### Basic Usage

```bash
# Check current rate limits
npm run github:check-limit

# Monitor continuously
npm run github:monitor-limit

# Wait for reset
npm run github:wait-reset

# Get reset recommendations
npm run github:reset-recommendations

# Get JSON output
npm run github:check-limit:json
```

---

## File Structure

```
CodePark/
├── scripts/
│   └── github-api-rate-limit-reset.js      # Main utility script
├── config/
│   └── github-rate-limit.config.js          # Configuration settings
├── docs/
│   ├── github-rate-limit-management.md     # Detailed documentation
│   └── GITHUB-RATE-LIMIT-README.md         # This file
├── package.json                             # Updated with npm scripts
└── logs/
    └── github-rate-limit.json              # Monitoring metrics (auto-generated)
```

---

## Usage Examples

### Example 1: Basic Rate Limit Check

```bash
$ npm run github:check-limit

[2025-12-14T12:35:00.123Z] [INFO] Checking GitHub API rate limits...

╔════════════════════════════════════════════════════════════════════════════════╗
║     GitHub API Rate Limit Status                                       ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 REST API:
   Core API:
     • Limit:      5000 requests/hour
     • Remaining:  4750 (95.00%)
     • Used:       250
     • Reset in:   45m 30s

   Search API:
     • Limit:      30 requests/minute
     • Remaining:  28 (93.33%)
     • Used:       2
     • Reset in:   2m 15s

🚀 GraphQL API:
   Authenticated as: skanda890
   • Limit:      5000 points/hour
   • Remaining:  4920 (98.40%)
   • Used:       80
   • Reset in:   52m 10s
```

### Example 2: Continuous Monitoring

```bash
$ npm run github:monitor-limit

[2025-12-14T12:35:00.123Z] [INFO] Starting rate limit monitoring (every 5 minutes)...
Press Ctrl+C to stop monitoring...

# Automatically checks every 5 minutes
# Displays full status each time
# Logs to file if configured
```

### Example 3: Wait for Reset

```bash
$ npm run github:wait-reset

[2025-12-14T12:41:00.123Z] [INFO] Monitoring rate limits and waiting for reset...

# Checks every 30 seconds
# Exits when all limits are healthy
```

### Example 4: JSON Output

```bash
$ npm run github:check-limit:json

{
  "rest": {
    "api": "REST",
    "timestamp": "2025-12-14T12:35:00.123Z",
    "core": {
      "limit": 5000,
      "remaining": 4750,
      "used": 250,
      "percent_remaining": "95.00%",
      "reset_at": 1702208100,
      "reset_in": "45m 30s",
      "nearly_exhausted": false
    }
  },
  "graphql": { ... }
}
```

---

## NPM Scripts

```json
{
  "scripts": {
    "github:check-limit": "Check current rate limit status",
    "github:check-limit:json": "Get rate limit status as JSON",
    "github:monitor-limit": "Monitor rate limits continuously",
    "github:wait-reset": "Wait for rate limit reset",
    "github:reset-recommendations": "Get reset recommendations"
  }
}
```

---

## Configuration

All configuration is in `config/github-rate-limit.config.js`:

### Key Settings

```javascript
{
  // Rate limit thresholds
  thresholds: {
    healthy: { min: 50 },     // 50%+ = healthy
    warning: { min: 20 },     // 20-50% = warning
    critical: { min: 0 },     // 0-20% = critical
  },

  // Monitoring settings
  monitoring: {
    checkInterval: 5,         // Check every 5 minutes
    enableAlerts: true,       // Enable notifications
    logLevel: 'info',         // Log level
  },

  // API optimization
  optimization: {
    preferGraphQL: true,      // Use GraphQL when possible
    caching: {
      enabled: true,
      ttlSeconds: 300,        // 5-minute cache
    },
    batchRequests: true,      // Batch similar requests
  }
}
```

---

## Best Practices

### 1. Always Authenticate

```bash
✅ DO:   export GITHUB_TOKEN="your_token"
❌ DON'T: Use unauthenticated requests
```

### 2. Prefer GraphQL

```javascript
// Fetch multiple resources efficiently
const query = `{
  repository(owner: "owner", name: "repo") {
    issues(first: 10) { nodes { id, title } }
    pullRequests(first: 10) { nodes { id, title } }
  }
}`;
// Cost: ~5 points (1 request)
```

vs REST (multiple requests):

```javascript
// REST requires 2+ separate calls
await fetch("/repos/owner/repo");
await fetch("/repos/owner/repo/issues");
await fetch("/repos/owner/repo/pulls");
// Cost: 3+ requests
```

### 3. Implement Caching

```javascript
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

async function getCached(key, fetcher) {
  if (cache.has(key)) {
    const { data, time } = cache.get(key);
    if (Date.now() - time < TTL) return data;
  }

  const data = await fetcher();
  cache.set(key, { data, time: Date.now() });
  return data;
}
```

### 4. Use Conditional Requests

```bash
# Use ETags to avoid counting against rate limit
curl -H "If-None-Match: W/\"123abc\"" https://api.github.com/repos/user/repo
# Returns 304 Not Modified = no rate limit consumed
```

### 5. Monitor Proactively

```bash
# Add to cron for continuous monitoring
0 * * * * npm run github:check-limit >> logs/rate-limit.log 2>&1
```

---

## Rate Limit Tiers

### REST API

| Tier            | Limit  | Window | Notes            |
| --------------- | ------ | ------ | ---------------- |
| Unauthenticated | 60     | 1 hour | Basic requests   |
| Authenticated   | 5,000  | 1 hour | With token       |
| GitHub App      | 15,000 | 1 hour | Per installation |

### GraphQL API

| Type       | Limit        | Cost            | Window |
| ---------- | ------------ | --------------- | ------ |
| Queries    | 5,000 points | 1-50+           | 1 hour |
| Complexity | Varies       | Query-dependent | 1 hour |
| Mutations  | 5,000 points | 10-100+         | 1 hour |

### Search API

| Tier         | Limit  | Window   | Notes              |
| ------------ | ------ | -------- | ------------------ |
| Search       | 30     | 1 minute | Separate limit     |
| Repositories | 30/min | 1 minute | Included in search |
| Issues       | 30/min | 1 minute | Included in search |

---

## Troubleshooting

### Issue: "GitHub token not provided"

```bash
# Solution: Set environment variable
export GITHUB_TOKEN="your_token_here"

# Or pass as argument
node scripts/github-api-rate-limit-reset.js --token ghp_xxxxx --check
```

### Issue: "Failed to get REST rate limit: 401"

```bash
# Solution: Token is invalid or expired
# Generate new token at https://github.com/settings/tokens
# Update GITHUB_TOKEN environment variable
```

### Issue: Rate limit exhausted

```bash
# Option 1: Wait for automatic reset
npm run github:wait-reset

# Option 2: Optimize API usage
# - Use GraphQL instead of REST
# - Implement caching
# - Use conditional requests
# - Batch requests

# Option 3: Use multiple tokens (for production)
# Configure round-robin token rotation
```

### Issue: GraphQL query too expensive

```graphql
# ❌ Expensive (cost ~50+)
query {
  repository(owner: "org", name: "repo") {
    issues(first: 100) {
      nodes {
        comments(first: 50) {
          nodes {
            body
          }
        }
      }
    }
  }
}

# ✅ Efficient (cost ~5)
query {
  repository(owner: "org", name: "repo") {
    issues(first: 10) {
      nodes {
        id
        title
      }
    }
  }
}
```

---

## Integration

### Node.js Application

```javascript
const GitHubRateLimitMonitor = require("./scripts/github-api-rate-limit-reset");

const monitor = new GitHubRateLimitMonitor(process.env.GITHUB_TOKEN);

// Check before making API calls
const limits = await monitor.checkRateLimits();

if (limits.graphql?.rateLimit?.remaining < 100) {
  console.warn("Low GraphQL quota, queuing requests...");
}
```

### GitHub Actions

```yaml
name: Monitor GitHub API Rate Limits

on:
  schedule:
    - cron: "0 * * * *" # Every hour

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run github:check-limit
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV GITHUB_TOKEN=${GITHUB_TOKEN}
CMD ["npm", "run", "github:monitor-limit"]
```

---

## Performance Metrics

### Response Times

- **REST API Check**: ~100-200ms
- **GraphQL API Check**: ~150-250ms
- **Combined Check**: ~200-400ms

### Resource Usage

- **Memory**: ~15-20 MB per process
- **CPU**: <1% during monitoring
- **Network**: ~1-2 KB per check

---

## References

- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api)
- [GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub REST API Reference](https://docs.github.com/en/rest)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

---

## Support

For issues or questions:

1. Check [docs/github-rate-limit-management.md](./github-rate-limit-management.md)
2. Review [config/github-rate-limit.config.js](../config/github-rate-limit.config.js)
3. Open an issue on [GitHub](https://github.com/skanda890/CodePark/issues)

---

## License

MIT License - See [LICENSE](../LICENSE) for details

---

**Version**: 1.0.0  
**Last Updated**: December 14, 2025  
**Author**: CodePark Contributors
