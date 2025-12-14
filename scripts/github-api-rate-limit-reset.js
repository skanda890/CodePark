#!/usr/bin/env node

/**
 * GitHub API Rate Limit Reset Utility
 *
 * This script monitors and manages GitHub API rate limits across different APIs:
 * - REST API (60 or 5000 requests/hour)
 * - GraphQL API (5000 points/hour)
 * - Search API (30 requests/minute)
 * - Issue/PR API (specific limits)
 *
 * Usage:
 *   node scripts/github-api-rate-limit-reset.js [options]
 *
 * Options:
 *   --token TOKEN           GitHub personal access token (or use GITHUB_TOKEN env var)
 *   --check                 Check rate limit status
 *   --reset                 Attempt to reset rate limits
 *   --monitor               Monitor rate limits every 5 minutes
 *   --wait                  Wait until rate limit resets
 *   --json                  Output as JSON
 *   --verbose               Verbose output
 */

const https = require('https')
const fs = require('fs')
require('dotenv').config()

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  GITHUB_API_BASE: 'https://api.github.com',
  RATE_LIMIT_ENDPOINTS: {
    REST: '/rate_limit',
    GRAPHQL: {
      endpoint: '/graphql',
      query: `query {
        viewer {
          login
        }
        rateLimit {
          limit
          cost
          remaining
          resetAt
        }
      }`
    }
  },
  API_LIMITS: {
    rest_authenticated: 5000,
    rest_unauthenticated: 60,
    graphql: 5000,
    search: 30,
    search_window: 60 // seconds
  }
}

// ============================================================================
// Rate Limit Monitor Class
// ============================================================================

class GitHubRateLimitMonitor {
  constructor (token) {
    this.token = token || process.env.GITHUB_TOKEN
    if (!this.token) {
      throw new Error(
        'GitHub token not provided. Set GITHUB_TOKEN env var or use --token'
      )
    }
    this.verbose = false
    this.jsonOutput = false
  }

  /**
   * Make HTTP request to GitHub API
   */
  async request (method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path,
        method,
        headers: {
          Authorization: `token ${this.token}`,
          'User-Agent': 'CodePark-GitHub-Rate-Limit-Monitor/1.0',
          Accept: 'application/vnd.github.v3+json',
          ...headers
        }
      }

      const req = https.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null
            }
            resolve(response)
          } catch (err) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data
            })
          }
        })
      })

      req.on('error', reject)

      if (body) {
        req.write(JSON.stringify(body))
      }

      req.end()
    })
  }

  /**
   * Get REST API rate limit status
   */
  async getRestRateLimit () {
    try {
      const response = await this.request(
        'GET',
        CONFIG.RATE_LIMIT_ENDPOINTS.REST
      )

      if (response.status !== 200) {
        throw new Error(`Failed to get REST rate limit: ${response.status}`)
      }

      return {
        api: 'REST',
        core: response.body.rate_limit.core || response.body.resources?.core,
        search:
          response.body.rate_limit.search || response.body.resources?.search,
        graphql:
          response.body.rate_limit.graphql || response.body.resources?.graphql,
        raw: response.body
      }
    } catch (error) {
      throw new Error(`REST API rate limit check failed: ${error.message}`)
    }
  }

  /**
   * Get GraphQL API rate limit status
   */
  async getGraphQLRateLimit () {
    try {
      const response = await this.request(
        'POST',
        CONFIG.RATE_LIMIT_ENDPOINTS.GRAPHQL.endpoint,
        { query: CONFIG.RATE_LIMIT_ENDPOINTS.GRAPHQL.query },
        {
          'Content-Type': 'application/json'
        }
      )

      if (response.status !== 200) {
        throw new Error(`Failed to get GraphQL rate limit: ${response.status}`)
      }

      if (response.body.errors) {
        throw new Error(
          `GraphQL errors: ${JSON.stringify(response.body.errors)}`
        )
      }

      return {
        api: 'GraphQL',
        viewer: response.body.data?.viewer?.login,
        rateLimit: response.body.data?.rateLimit,
        raw: response.body
      }
    } catch (error) {
      throw new Error(`GraphQL API rate limit check failed: ${error.message}`)
    }
  }

  /**
   * Calculate time until rate limit reset
   */
  calculateTimeUntilReset (resetUnixTimestamp) {
    const now = Math.floor(Date.now() / 1000)
    const secondsUntilReset = resetUnixTimestamp - now

    if (secondsUntilReset <= 0) {
      return { seconds: 0, formatted: 'NOW' }
    }

    const hours = Math.floor(secondsUntilReset / 3600)
    const minutes = Math.floor((secondsUntilReset % 3600) / 60)
    const seconds = secondsUntilReset % 60

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return {
      seconds: secondsUntilReset,
      formatted: parts.join(' ') || '0s',
      hours,
      minutes,
      seconds,
      resetAt: new Date(resetUnixTimestamp * 1000)
    }
  }

  /**
   * Check if rate limit is nearly exhausted
   */
  isNearlyExhausted (remaining, limit) {
    const threshold = Math.max(limit * 0.1, 10) // 10% or 10 requests, whichever is larger
    return remaining <= threshold
  }

  /**
   * Format rate limit data for display
   */
  formatRateLimitData (data) {
    const formatted = {
      api: data.api,
      timestamp: new Date().toISOString()
    }

    if (data.core) {
      const resetTime = this.calculateTimeUntilReset(data.core.reset)
      formatted.core = {
        limit: data.core.limit,
        remaining: data.core.remaining,
        used: data.core.limit - data.core.remaining,
        percent_remaining:
          ((data.core.remaining / data.core.limit) * 100).toFixed(2) + '%',
        reset_at: data.core.reset,
        reset_in: resetTime.formatted,
        nearly_exhausted: this.isNearlyExhausted(
          data.core.remaining,
          data.core.limit
        )
      }
    }

    if (data.search) {
      const resetTime = this.calculateTimeUntilReset(data.search.reset)
      formatted.search = {
        limit: data.search.limit,
        remaining: data.search.remaining,
        used: data.search.limit - data.search.remaining,
        percent_remaining:
          ((data.search.remaining / data.search.limit) * 100).toFixed(2) + '%',
        reset_at: data.search.reset,
        reset_in: resetTime.formatted,
        nearly_exhausted: this.isNearlyExhausted(
          data.search.remaining,
          data.search.limit
        )
      }
    }

    if (data.graphql) {
      const resetTime = this.calculateTimeUntilReset(data.graphql.reset)
      formatted.graphql = {
        limit: data.graphql.limit,
        remaining: data.graphql.remaining,
        used: data.graphql.limit - data.graphql.remaining,
        percent_remaining:
          ((data.graphql.remaining / data.graphql.limit) * 100).toFixed(2) +
          '%',
        reset_at: data.graphql.reset,
        reset_in: resetTime.formatted,
        nearly_exhausted: this.isNearlyExhausted(
          data.graphql.remaining,
          data.graphql.limit
        )
      }
    }

    if (data.rateLimit) {
      const resetTime = this.calculateTimeUntilReset(
        Math.floor(new Date(data.rateLimit.resetAt).getTime() / 1000)
      )
      formatted.graphql = {
        limit: data.rateLimit.limit,
        remaining: data.rateLimit.remaining,
        cost: data.rateLimit.cost,
        reset_at: data.rateLimit.resetAt,
        reset_in: resetTime.formatted,
        nearly_exhausted: this.isNearlyExhausted(
          data.rateLimit.remaining,
          data.rateLimit.limit
        )
      }
    }

    return formatted
  }

  /**
   * Print formatted output
   */
  print (message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}]`

    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m'
    }

    const color = colors[level] || colors.info
    console.log(
      `${color}${prefix} [${level.toUpperCase()}]${colors.reset} ${message}`
    )
  }

  /**
   * Display rate limit status
   */
  displayStatus (restData, graphqlData) {
    if (this.jsonOutput) {
      const output = {
        rest: restData ? this.formatRateLimitData(restData) : null,
        graphql: graphqlData ? this.formatRateLimitData(graphqlData) : null,
        timestamp: new Date().toISOString()
      }
      console.log(JSON.stringify(output, null, 2))
      return
    }

    console.log('\n╔════════════════════════════════════════════════════════╗')
    console.log('║     GitHub API Rate Limit Status                       ║')
    console.log('╚════════════════════════════════════════════════════════╝\n')

    if (restData) {
      console.log('📊 REST API:')
      if (restData.core) {
        const coreStatus = this.formatRateLimitData(restData)
        console.log('   Core API:')
        console.log(
          `     • Limit:      ${coreStatus.core.limit} requests/hour`
        )
        console.log(
          `     • Remaining:  ${coreStatus.core.remaining} (${coreStatus.core.percent_remaining})`
        )
        console.log(`     • Used:       ${coreStatus.core.used}`)
        console.log(`     • Reset in:   ${coreStatus.core.reset_in}`)
        if (coreStatus.core.nearly_exhausted) {
          this.print('   ⚠️  Core API rate limit nearly exhausted!', 'warning')
        }
      }

      if (restData.search) {
        const searchStatus = this.formatRateLimitData(restData)
        console.log('\n   Search API:')
        console.log(
          `     • Limit:      ${searchStatus.search.limit} requests/minute`
        )
        console.log(
          `     • Remaining:  ${searchStatus.search.remaining} (${searchStatus.search.percent_remaining})`
        )
        console.log(`     • Used:       ${searchStatus.search.used}`)
        console.log(`     • Reset in:   ${searchStatus.search.reset_in}`)
        if (searchStatus.search.nearly_exhausted) {
          this.print(
            '   ⚠️  Search API rate limit nearly exhausted!',
            'warning'
          )
        }
      }
    }

    if (graphqlData) {
      console.log('\n🚀 GraphQL API:')
      const graphqlStatus = this.formatRateLimitData(graphqlData)
      if (graphqlData.viewer) {
        console.log(`   Authenticated as: ${graphqlData.viewer}`)
      }
      console.log(
        `   • Limit:      ${graphqlStatus.graphql.limit} points/hour`
      )
      console.log(
        `   • Remaining:  ${graphqlStatus.graphql.remaining} (${graphqlStatus.graphql.percent_remaining})`
      )
      console.log(`   • Used:       ${graphqlStatus.graphql.used}`)
      console.log(`   • Reset in:   ${graphqlStatus.graphql.reset_in}`)
      if (graphqlStatus.graphql.nearly_exhausted) {
        this.print(
          '   ⚠️  GraphQL API rate limit nearly exhausted!',
          'warning'
        )
      }
    }

    console.log('\n')
  }

  /**
   * Check rate limits
   */
  async checkRateLimits () {
    try {
      this.print('Checking GitHub API rate limits...', 'info')

      const [restData, graphqlData] = await Promise.allSettled([
        this.getRestRateLimit(),
        this.getGraphQLRateLimit()
      ])

      const restResult =
        restData.status === 'fulfilled' ? restData.value : null
      const graphqlResult =
        graphqlData.status === 'fulfilled' ? graphqlData.value : null

      if (!restResult && !graphqlResult) {
        this.print(
          'Failed to check both REST and GraphQL rate limits',
          'error'
        )
        process.exit(1)
      }

      if (restData.status === 'rejected') {
        this.print(
          `REST API check failed: ${restData.reason.message}`,
          'warning'
        )
      }

      if (graphqlData.status === 'rejected') {
        this.print(
          `GraphQL API check failed: ${graphqlData.reason.message}`,
          'warning'
        )
      }

      this.displayStatus(restResult, graphqlResult)

      return {
        rest: restResult,
        graphql: graphqlResult
      }
    } catch (error) {
      this.print(`Error checking rate limits: ${error.message}`, 'error')
      process.exit(1)
    }
  }

  /**
   * Wait for rate limit reset
   */
  async waitForReset () {
    try {
      this.print('Monitoring rate limits and waiting for reset...', 'info')

      while (true) {
        const data = await this.checkRateLimits()
        let anyNearlyExhausted = false

        if (data.rest) {
          const restFormatted = this.formatRateLimitData(data.rest)
          if (restFormatted.core?.nearly_exhausted) anyNearlyExhausted = true
          if (restFormatted.search?.nearly_exhausted) anyNearlyExhausted = true
        }

        if (data.graphql) {
          const graphqlFormatted = this.formatRateLimitData(data.graphql)
          if (graphqlFormatted.graphql?.nearly_exhausted) {
            anyNearlyExhausted = true
          }
        }

        if (!anyNearlyExhausted) {
          this.print('All rate limits are healthy. Exiting...', 'success')
          break
        }

        // Wait 30 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 30000))
      }
    } catch (error) {
      this.print(`Error waiting for reset: ${error.message}`, 'error')
      process.exit(1)
    }
  }

  /**
   * Monitor rate limits continuously
   */
  async monitor (intervalMinutes = 5) {
    this.print(
      `Starting rate limit monitoring (every ${intervalMinutes} minutes)...`,
      'info'
    )
    const intervalMs = intervalMinutes * 60 * 1000

    // Check immediately
    await this.checkRateLimits()

    // Then check periodically
    setInterval(async () => {
      try {
        await this.checkRateLimits()
      } catch (error) {
        this.print(`Error during monitoring: ${error.message}`, 'error')
      }
    }, intervalMs)

    // Keep process alive
    console.log('Press Ctrl+C to stop monitoring...\n')
  }

  /**
   * Provide recommendations to reset rate limits
   */
  async reset () {
    try {
      this.print(
        'Analyzing rate limit status for reset recommendations...',
        'info'
      )
      const data = await this.checkRateLimits()

      console.log(
        '\n╔════════════════════════════════════════════════════════╗'
      )
      console.log('║     Rate Limit Reset Recommendations                   ║')
      console.log(
        '╚════════════════════════════════════════════════════════╝\n'
      )

      console.log('✓ How to Reset GitHub API Rate Limits:\n')

      console.log('1. WAIT FOR AUTOMATIC RESET (Recommended)')
      console.log('   • REST API: Resets hourly at the reset time')
      console.log('   • GraphQL API: Resets hourly at the reset time')
      console.log('   • No action required - limits reset automatically\n')

      console.log('2. INCREASE YOUR LIMITS')
      console.log(
        '   • Authenticate with a Personal Access Token (already using token ✓)'
      )
      console.log('   • REST: 5000 requests/hour (vs 60 for unauthenticated)')
      console.log('   • GraphQL: 5000 points/hour\n')

      console.log('3. OPTIMIZE YOUR API USAGE')
      console.log(
        '   • Use GraphQL to reduce API calls (fetch multiple fields in one request)'
      )
      console.log('   • Implement caching to avoid redundant requests')
      console.log(
        '   • Use conditional requests (ETags) to avoid counting against limits'
      )
      console.log('   • Batch requests where possible\n')

      console.log('4. USE HIGHER-TIER GITHUB PLANS')
      console.log('   • GitHub Pro/Enterprise: Higher rate limits')
      console.log(
        '   • GitHub Apps: Can have higher limits per installation\n'
      )

      console.log('5. IMPLEMENT RATE LIMIT AWARE RETRY LOGIC')
      console.log(
        '   • Check rate_limit response headers before making requests'
      )
      console.log('   • Implement exponential backoff retry strategy')
      console.log('   • Queue requests during off-peak hours\n')

      console.log('╔════════════════════════════════════════════════════════╗')
      console.log('║     Current Status & Next Reset Times                 ║')
      console.log(
        '╚════════════════════════════════════════════════════════╝\n'
      )

      if (data.rest) {
        const restFormatted = this.formatRateLimitData(data.rest)
        console.log('REST API:')
        if (restFormatted.core) {
          console.log(`  Core: Resets in ${restFormatted.core.reset_in}`)
          console.log(
            `        (${new Date(restFormatted.core.reset_at * 1000).toLocaleString()})\n`
          )
        }
        if (restFormatted.search) {
          console.log(`  Search: Resets in ${restFormatted.search.reset_in}`)
          console.log(
            `          (${new Date(restFormatted.search.reset_at * 1000).toLocaleString()})\n`
          )
        }
      }

      if (data.graphql) {
        const graphqlFormatted = this.formatRateLimitData(data.graphql)
        console.log('GraphQL API:')
        console.log(`  Resets in ${graphqlFormatted.graphql.reset_in}`)
        console.log(`  (${graphqlFormatted.graphql.reset_at})\n`)
      }
    } catch (error) {
      this.print(`Error: ${error.message}`, 'error')
      process.exit(1)
    }
  }
}

// ============================================================================
// CLI Handler
// ============================================================================

async function main () {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
GitHub API Rate Limit Reset Utility

Usage:
  node scripts/github-api-rate-limit-reset.js [options]

Options:
  --token TOKEN           GitHub personal access token (or use GITHUB_TOKEN env var)
  --check                 Check rate limit status (default action)
  --reset                 Show reset recommendations and wait until limits are healthy
  --monitor               Continuously monitor rate limits (every 5 minutes)
  --wait                  Wait until rate limit resets
  --json                  Output as JSON
  --verbose               Verbose output
  --help, -h              Show this help message

Examples:
  # Check current rate limits
  node scripts/github-api-rate-limit-reset.js --check

  # Monitor rate limits continuously
  node scripts/github-api-rate-limit-reset.js --monitor

  # Wait for rate limit reset
  node scripts/github-api-rate-limit-reset.js --wait

  # Get recommendations for reset
  node scripts/github-api-rate-limit-reset.js --reset

  # Check with custom token
  node scripts/github-api-rate-limit-reset.js --check --token ghp_xxxxx

  # Output as JSON
  node scripts/github-api-rate-limit-reset.js --check --json

Environment Variables:
  GITHUB_TOKEN            GitHub personal access token

For token generation:
  1. Go to https://github.com/settings/tokens
  2. Create new Personal Access Token
  3. Select scopes: 'repo', 'read:org'
  4. Copy token and set GITHUB_TOKEN env var or pass with --token

Rate Limit Tiers:
  REST API (authenticated):    5000 requests/hour
  REST API (unauthenticated):  60 requests/hour
  GraphQL API:                 5000 points/hour (cost varies by query)
  Search API:                  30 requests/minute
    `)
    process.exit(0)
  }

  try {
    const token = args.includes('--token')
      ? args[args.indexOf('--token') + 1]
      : process.env.GITHUB_TOKEN

    const monitor = new GitHubRateLimitMonitor(token)
    monitor.verbose = args.includes('--verbose')
    monitor.jsonOutput = args.includes('--json')

    if (args.includes('--check')) {
      await monitor.checkRateLimits()
    } else if (args.includes('--reset')) {
      await monitor.reset()
    } else if (args.includes('--monitor')) {
      await monitor.monitor()
    } else if (args.includes('--wait')) {
      await monitor.waitForReset()
    } else {
      // Default to check
      await monitor.checkRateLimits()
    }
  } catch (error) {
    console.error(`\x1b[31m✗ Error: ${error.message}\x1b[0m`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`\x1b[31m✗ Fatal Error: ${error.message}\x1b[0m`)
  process.exit(1)
})

module.exports = GitHubRateLimitMonitor
