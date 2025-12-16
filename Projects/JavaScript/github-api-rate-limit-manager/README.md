# GitHub API Rate Limit Manager

**Location**: `Coding/Languages/JavaScript/github-api-rate-limit-manager/`

> Comprehensive GitHub API rate limit monitoring and management system

## Overview

A production-ready Node.js utility for monitoring and managing GitHub API rate limits in real-time. Track REST API (Core & Search) and GraphQL API quotas with continuous monitoring, automatic reset waiting, and optimization recommendations.

## Features

✅ **Real-time Monitoring**

- REST API (Core & Search) rate limit tracking
- GraphQL API point tracking
- Health status detection
- Continuous background monitoring
- Wait-for-reset automation

✅ **Optimization**

- API usage recommendations
- GraphQL vs REST comparison
- Caching strategies
- Best practices (10 tips included)
- Performance tuning

✅ **Integration**

- Zero external dependencies (native Node.js only)
- JSON output support
- CLI commands ready
- GitHub Actions compatible
- NPM scripts included

✅ **Documentation**

- 45+ KB comprehensive guides
- 30+ code examples
- Multiple learning paths
- Production-ready

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- GitHub Personal Access Token

### Installation

```bash
# 1. Generate GitHub Token
# Visit: https://github.com/settings/tokens

# 2. Set environment variable
export GITHUB_TOKEN="ghp_your_personal_access_token"

# 3. Run the utility
node scripts/github-api-rate-limit-reset.js --check
```

### Usage

```bash
# Check current rate limits
node scripts/github-api-rate-limit-reset.js --check

# Get JSON output
node scripts/github-api-rate-limit-reset.js --check --json

# Monitor continuously
node scripts/github-api-rate-limit-reset.js --monitor

# Wait for rate limit reset
node scripts/github-api-rate-limit-reset.js --wait

# Get optimization recommendations
node scripts/github-api-rate-limit-reset.js --recommendations
```

## Project Structure

```
github-api-rate-limit-manager/
├── scripts/
│   └── github-api-rate-limit-reset.js (11.1 KB)
├── config/
│   └── github-rate-limit.config.js (4.2 KB)
├── docs/
│   ├── GITHUB-RATE-LIMIT-QUICKSTART.md
│   ├── GITHUB-RATE-LIMIT-README.md
│   ├── github-rate-limit-management.md
│   ├── GITHUB-RATE-LIMIT-PROJECT-SUMMARY.md
│   ├── GITHUB-RATE-LIMIT-FEATURES-ROADMAP.md
│   ├── GITHUB-RATE-LIMIT-IMPLEMENTATION.md
│   └── WAIT-FOR-RESET-CLARIFICATION.md
├── README.md (this file)
└── package.json
```

## Configuration

Edit `config/github-rate-limit.config.js` to customize:

- Alert thresholds
- Monitoring intervals
- Optimization strategies
- Feature flags
- Performance settings

## Commands

### Check Rate Limits

```bash
node scripts/github-api-rate-limit-reset.js --check
```

Displays current rate limit status with:

- Remaining requests/points
- Percentage used
- Reset time
- Time remaining

### Monitor Continuously

```bash
node scripts/github-api-rate-limit-reset.js --monitor
```

Continuously checks rate limits (every 5 minutes by default)
Press `Ctrl+C` to stop

### Wait for Reset

```bash
node scripts/github-api-rate-limit-reset.js --wait
```

**ACTIVELY WAITS** (pauses execution) until rate limit becomes available.
Perfect for automated scripts and CI/CD pipelines.

### Get Recommendations

```bash
node scripts/github-api-rate-limit-reset.js --recommendations
```

Provides optimization tips based on current usage.

## Environment Variables

```bash
# Required
export GITHUB_TOKEN="ghp_your_token"

# Optional (v1.1+)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export DATABASE_URL="mongodb://..."
```

## Rate Limits (Typical Values)

> **Note**: These are typical defaults. Actual limits vary based on:
>
> - Authentication type (Personal token vs GitHub App)
> - Endpoint being called
> - User/Organization tier
> - Conditional requests
> - Repository visibility
>
> Always verify: <https://docs.github.com/en/rest/overview/resources-in-the-rest-api>

| API           | Limit        | Window   |
| ------------- | ------------ | -------- |
| REST (Core)   | 5,000        | 1 hour   |
| REST (Search) | 30           | 1 minute |
| GraphQL       | 5,000 points | 1 hour   |

## Features Roadmap

### v1.0 (Current)

✅ Real-time monitoring
✅ REST API tracking
✅ GraphQL tracking
✅ Wait-for-reset
✅ Optimization tips

### v1.1 (Q1 2025)

🔄 Multi-token support
🔄 Slack/Discord notifications
🔄 Email alerts
🔄 Database logging

### v1.2 (Q2 2025)

🔄 Web dashboard
🔄 GitHub App integration
🔄 Smart queuing
🔄 Cost analysis

### v2.0 (Q4 2025)

🔄 Multi-platform support
🔄 GraphQL code generator
🔄 Request deduplication
🔄 Prometheus/Grafana integration

## Best Practices

1. **Check before bulk operations**

   ```bash
   npm run github:check-limit  # Verify quota available
   ```

2. **Use wait-for-reset in CI/CD**

   ```bash
   npm run github:wait-reset  # Pause until reset
   ```

3. **Implement conditional requests**
   - Use ETags to reduce consumption
   - Cache responses locally

4. **Prefer GraphQL for batch operations**
   - More efficient
   - Lower point cost
   - Better for complex queries

5. **Monitor production usage**
   ```bash
   npm run github:monitor-limit &  # Background monitoring
   ```

## Documentation

Detailed documentation available in `docs/` directory:

- **GITHUB-RATE-LIMIT-QUICKSTART.md** - 5-minute setup
- **GITHUB-RATE-LIMIT-README.md** - Complete guide
- **github-rate-limit-management.md** - Technical deep dive
- **WAIT-FOR-RESET-CLARIFICATION.md** - Wait behavior explained
- **GITHUB-RATE-LIMIT-FEATURES-ROADMAP.md** - Future versions

## Troubleshooting

### Error: GITHUB_TOKEN not set

```bash
export GITHUB_TOKEN="your_token_here"
```

### Script runs slowly

- Reduce monitoring interval in config
- Use JSON output for faster parsing
- Check network connectivity

### Rate limit unexpected

- Verify your token permissions
- Check GitHub account tier
- Review rate limit documentation

## Version Info

- **Version**: 1.0.0
- **Status**: Production Ready
- **Dependencies**: 0 (uses native Node.js)
- **Node.js**: 20.0.0+
- **NPM**: 10.0.0+

## Links

- **GitHub Issues**: <https://github.com/skanda890/CodePark/issues>
- **Discussions**: <https://github.com/skanda890/CodePark/discussions>
- **GitHub API Docs**: <https://docs.github.com/en/rest>
- **Rate Limit Docs**: <https://docs.github.com/en/rest/overview/resources-in-the-rest-api>

## License

Part of CodePark project

---

**Made with ❤️ for developers who need to manage GitHub API rate limits efficiently**
