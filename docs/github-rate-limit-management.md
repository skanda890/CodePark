# GitHub API Rate Limit Management

Comprehensive guide for monitoring and managing GitHub API rate limits in the CodePark project.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limit Types](#rate-limit-types)
3. [Quick Start](#quick-start)
4. [Usage Examples](#usage-examples)
5. [API Responses](#api-responses)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Integration](#integration)

---

## Overview

GitHub API has rate limits to prevent abuse and ensure fair service availability:

- **REST API**: 5,000 requests/hour (authenticated) or 60/hour (unauthenticated)
- **GraphQL API**: 5,000 points/hour
- **Search API**: 30 requests/minute
- **GitHub Apps**: Can have higher limits per installation

The `github-api-rate-limit-reset.js` utility helps you:

✅ Monitor current rate limit status  
✅ Detect when limits are nearly exhausted  
✅ Wait for automatic rate limit reset  
✅ Get recommendations for optimization  
✅ Continuously track usage patterns  

---

## Rate Limit Types

### 1. REST API Core

**Authenticated**: 5,000 requests/hour  
**Unauthenticated**: 60 requests/hour

Includes:
- Repository operations
- Issue/PR management
- User information
- Commit operations

**Reset**: Hourly, sliding window

### 2. GraphQL API

**Limit**: 5,000 points/hour  
**Cost**: Each query costs points based on complexity

Example costs:
- Simple query (viewer info): 1 point
- Nested queries (with relationships): 5-50 points
- Complex mutations: 10-100 points

**Advantages**:
- Fetch multiple resources in one request
- Reduces total API calls
- More efficient than REST for complex queries

### 3. Search API

**Limit**: 30 requests/minute  
**Authenticated**: Same as core API

Includes:
- Repository search
- Issue/PR search
- Code search
- User search

**Note**: Search API has separate limits and is the first to hit during heavy searches.

---

## Quick Start

### Prerequisites

1. **GitHub Personal Access Token**
   ```bash
   # Go to: https://github.com/settings/tokens
   # Create token with scopes: 'repo', 'read:org'
   # Copy token to .env file
   ```

2. **Set Environment Variable**
   ```bash
   export GITHUB_TOKEN="your_token_here"
   # OR add to .env file
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Basic Usage

```bash
# Check current rate limits
node scripts/github-api-rate-limit-reset.js --check

# Monitor continuously
node scripts/github-api-rate-limit-reset.js --monitor

# Wait for reset
node scripts/github-api-rate-limit-reset.js --wait

# Get recommendations
node scripts/github-api-rate-limit-reset.js --reset
```

---

## Usage Examples

### Example 1: Check Current Status

```bash
$ node scripts/github-api-rate-limit-reset.js --check

[2025-12-14T12:34:56.789Z] [INFO] Checking GitHub API rate limits...

╔════════════════════════════════════════════════════════════════╗
║     GitHub API Rate Limit Status                       ║
╚════════════════════════════════════════════════════════════════╝

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
$ node scripts/github-api-rate-limit-reset.js --monitor

[2025-12-14T12:35:00.123Z] [INFO] Starting rate limit monitoring (every 5 minutes)...
Press Ctrl+C to stop monitoring...

[2025-12-14T12:35:00.456Z] [INFO] Checking GitHub API rate limits...
[Displays current status]

[2025-12-14T12:40:00.123Z] [INFO] Checking GitHub API rate limits...
[Displays current status]
```

### Example 3: Wait for Rate Limit Reset

```bash
$ node scripts/github-api-rate-limit-reset.js --wait

[2025-12-14T12:41:00.123Z] [INFO] Monitoring rate limits and waiting for reset...
[Checks every 30 seconds]
[Exits when all limits are healthy]
```

### Example 4: JSON Output

```bash
$ node scripts/github-api-rate-limit-reset.js --check --json

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
    },
    "search": {
      "limit": 30,
      "remaining": 28,
      "used": 2,
      "percent_remaining": "93.33%",
      "reset_at": 1702207935,
      "reset_in": "2m 15s",
      "nearly_exhausted": false
    }
  },
  "graphql": {
    "api": "GraphQL",
    "timestamp": "2025-12-14T12:35:00.456Z",
    "graphql": {
      "limit": 5000,
      "remaining": 4920,
      "used": 80,
      "percent_remaining": "98.40%",
      "reset_at": "2025-12-14T13:35:00Z",
      "reset_in": "52m 10s",
      "nearly_exhausted": false
    }
  },
  "timestamp": "2025-12-14T12:35:00.123Z"
}
```

---

## API Responses

### REST API Response

```javascript
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4750,
      "reset": 1702208100,
      "used": 250
    },
    "search": {
      "limit": 30,
      "remaining": 28,
      "reset": 1702207935,
      "used": 2
    },
    "graphql": {
      "limit": 5000,
      "remaining": 4920,
      "reset": 1702211700,
      "used": 80
    }
  },
  "rate_limit": {
    "limit": 5000,
    "remaining": 4750,
    "reset": 1702208100
  }
}
```

### GraphQL API Response

```graphql
query {
  viewer {
    login
  }
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
```

**Response**:
```json
{
  "data": {
    "viewer": {
      "login": "skanda890"
    },
    "rateLimit": {
      "limit": 5000,
      "cost": 1,
      "remaining": 4920,
      "resetAt": "2025-12-14T13:35:00Z"
    }
  }
}
```

---

## Best Practices

### 1. Use Authentication

✅ **DO**: Always authenticate with a Personal Access Token
```bash
export GITHUB_TOKEN="your_token"
```

❌ **DON'T**: Use unauthenticated requests (60 req/hour limit)

### 2. Prefer GraphQL

✅ **GraphQL** (efficient):
```graphql
query {
  repository(owner: "skanda890", name: "CodePark") {
    name
    description
    issues(first: 10) {
      nodes { id, title }
    }
    pullRequests(first: 10) {
      nodes { id, title }
    }
  }
}
```
Cost: ~5-10 points (1 request)

❌ **REST** (inefficient):
```javascript
// Repo info - 1 request
await fetch('GET /repos/skanda890/CodePark')
// Issues - 1+ requests
await fetch('GET /repos/skanda890/CodePark/issues')
// PRs - 1+ requests
await fetch('GET /repos/skanda890/CodePark/pulls')
```
Cost: 3+ requests

### 3. Implement Caching

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRepoInfo(owner, repo) {
  const key = `${owner}/${repo}`;
  const cached = cache.get(key);
  
  // Check cache
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch fresh data
  const data = await fetch(...);
  cache.set(key, { data, time: Date.now() });
  return data;
}
```

### 4. Use Conditional Requests

```javascript
// Use ETags to avoid counting against rate limit
const headers = {
  'If-None-Match': etag, // From previous response
};

const response = await fetch(url, { headers });
// 304 Not Modified = no rate limit consumed
```

### 5. Batch Operations

```javascript
// Bad: Multiple individual calls
for (let repo of repos) {
  await fetch(`/repos/${repo}`);
}

// Good: Batch with GraphQL
const query = `
  query {
    ${repos.map((r, i) => `repo${i}: repository(owner:"user", name:"${r}") {
      name
    }`).join('\n')}
  }
`;
await fetch('/graphql', { query });
```

### 6. Monitor and Alert

```bash
# Add to cron job for periodic monitoring
0 * * * * node /path/scripts/github-api-rate-limit-reset.js --check --json >> /var/log/github-rate-limit.log

# Monitor for warnings
*/5 * * * * node /path/scripts/github-api-rate-limit-reset.js --check | grep -i "exhausted" && send-alert
```

---

## Troubleshooting

### Issue: "GitHub token not provided"

**Solution**: Set GITHUB_TOKEN environment variable
```bash
export GITHUB_TOKEN="ghp_xxxxx"
# OR
node scripts/github-api-rate-limit-reset.js --token ghp_xxxxx --check
```

### Issue: "Failed to get REST rate limit: 401"

**Solution**: Token is invalid or expired
```bash
# Verify token validity
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Generate new token at https://github.com/settings/tokens
```

### Issue: "Rate limit nearly exhausted"

**Solution**: Follow the reset recommendations
```bash
node scripts/github-api-rate-limit-reset.js --reset
```

### Issue: GraphQL query returns high cost

**Solution**: Reduce query complexity
```graphql
# ❌ Expensive (cost ~50+)
query {
  repository(owner: "org", name: "repo") {
    issues(first: 100) {
      nodes {
        comments(first: 50) {
          nodes { body }
        }
      }
    }
  }
}

# ✅ Efficient (cost ~5)
query {
  repository(owner: "org", name: "repo") {
    issues(first: 10, first: 10) {
      nodes { id title }
    }
  }
}
```

---

## Integration

### Node.js Application

```javascript
const GitHubRateLimitMonitor = require('./scripts/github-api-rate-limit-reset');

const monitor = new GitHubRateLimitMonitor(process.env.GITHUB_TOKEN);
monitor.verbose = true;

// Check limits before making API calls
const limits = await monitor.checkRateLimits();

if (limits.graphql?.rateLimit?.remaining < 100) {
  console.warn('GraphQL rate limit low, queuing requests...');
  // Implement queuing logic
}
```

### GitHub Actions

```yaml
name: Check GitHub API Rate Limits

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  check-rate-limits:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Check API Rate Limits
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          node scripts/github-api-rate-limit-reset.js --check
      
      - name: Alert if Rate Limit Low
        if: always()
        run: |
          node scripts/github-api-rate-limit-reset.js --check --json > rate-limit.json
          # Parse and alert if needed
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY scripts/ ./scripts/

ENV GITHUB_TOKEN=${GITHUB_TOKEN}

CMD ["node", "scripts/github-api-rate-limit-reset.js", "--monitor"]
```

```bash
# Run monitoring in background
docker run -e GITHUB_TOKEN="your_token" -d codepark-monitor
```

---

## Reference

### Command Syntax

```
node scripts/github-api-rate-limit-reset.js [options]

Options:
  --token TOKEN           GitHub PAT
  --check                 Check status (default)
  --reset                 Show recommendations
  --monitor               Continuous monitoring
  --wait                  Wait for reset
  --json                  JSON output
  --verbose               Verbose logging
  --help, -h              Show help
```

### Rate Limit Thresholds

- ✅ **Healthy**: > 20% remaining
- ⚠️ **Warning**: 10-20% remaining
- 🔴 **Critical**: < 10% remaining

### Resources

- [GitHub API Rate Limit Docs](https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#rate-limiting)
- [GraphQL API Documentation](https://docs.github.com/en/graphql)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub REST API Reference](https://docs.github.com/en/rest)

---

**Last Updated**: December 14, 2025  
**Version**: 1.0.0
