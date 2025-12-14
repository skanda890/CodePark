#!/usr/bin/env node

/**
 * GitHub API Rate Limit Monitor
 * Monitors and tracks GitHub API rate limits in real-time
 * 
 * Usage:
 *   npm run github:check-limit         # Check current limits
 *   npm run github:check-limit:json    # Output as JSON
 *   npm run github:monitor-limit       # Continuous monitoring
 *   npm run github:wait-reset          # Wait for rate limit reset
 *   npm run github:reset-recommendations # Get optimization tips
 */

// Load environment variables from .env if it exists (optional)
// Uses only Node.js native modules for zero external dependencies
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
} catch (e) {
  // Silently fail - .env is optional, process.env vars work fine
}

const https = require('https');
const config = require('../config/github-rate-limit.config');

/**
 * GitHubRateLimitMonitor Class
 * Handles all rate limit monitoring operations
 */
class GitHubRateLimitMonitor {
  constructor(token = process.env.GITHUB_TOKEN) {
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set. Set it with: export GITHUB_TOKEN="your_token"');
    }
    this.token = token;
    this.config = config;
  }

  /**
   * Make HTTP request to GitHub API
   */
  async request(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: path,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'GitHub-API-Rate-Limit-Monitor',
          'Accept': 'application/vnd.github+json'
        }
      };

      https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data
            });
          }
        });
      }).on('error', reject).end();
    });
  }

  /**
   * Get rate limit information
   */
  async checkRateLimits() {
    const response = await this.request('/rate_limit');
    
    if (response.status !== 200) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return {
      rest: {
        core: response.body.resources.core,
        search: response.body.resources.search
      },
      graphql: response.body.resources.graphql,
      timestamp: new Date(response.headers['date']).toISOString()
    };
  }

  /**
   * Get health status based on remaining percentage
   */
  getHealthStatus(remaining, limit) {
    const percentage = (remaining / limit) * 100;
    if (percentage >= 50) return { status: 'healthy', emoji: '✓', color: 'green' };
    if (percentage >= 20) return { status: 'warning', emoji: '⚠', color: 'yellow' };
    return { status: 'critical', emoji: '✗', color: 'red' };
  }

  /**
   * Format output with colors (ANSI)
   */
  colorize(text, color) {
    const colors = {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  /**
   * Format time remaining
   */
  formatTimeRemaining(resetTime) {
    const now = Date.now();
    const reset = new Date(resetTime).getTime();
    const diff = reset - now;
    
    if (diff <= 0) return 'Ready';
    
    const minutes = Math.floor((diff / 1000) / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Display rate limits
   */
  async displayLimits(jsonOutput = false) {
    const limits = await this.checkRateLimits();
    
    if (jsonOutput) {
      console.log(JSON.stringify(limits, null, 2));
      return limits;
    }

    console.log(this.colorize('\n✓ GitHub API Rate Limit Monitor\n', 'blue'));

    // REST API (Core)
    const core = limits.rest.core;
    const coreHealth = this.getHealthStatus(core.remaining, core.limit);
    const corePercent = ((core.remaining / core.limit) * 100).toFixed(2);
    console.log(this.colorize(`REST API (Core):`, 'bold'));
    console.log(`  ${coreHealth.emoji} Remaining: ${core.remaining}/${core.limit} requests`);
    console.log(`  Percentage: ${corePercent}%`);
    console.log(`  Reset time: ${new Date(core.reset * 1000).toLocaleString()}`);
    console.log(`  Time remaining: ${this.formatTimeRemaining(core.reset * 1000)}`);

    // Search API
    const search = limits.rest.search;
    const searchHealth = this.getHealthStatus(search.remaining, search.limit);
    const searchPercent = ((search.remaining / search.limit) * 100).toFixed(2);
    console.log(this.colorize(`\nSearch API:`, 'bold'));
    console.log(`  ${searchHealth.emoji} Remaining: ${search.remaining}/${search.limit} requests`);
    console.log(`  Percentage: ${searchPercent}%`);
    console.log(`  Reset time: ${new Date(search.reset * 1000).toLocaleString()}`);
    console.log(`  Time remaining: ${this.formatTimeRemaining(search.reset * 1000)}`);

    // GraphQL API
    const gql = limits.graphql;
    const gqlHealth = this.getHealthStatus(gql.remaining, gql.limit);
    const gqlPercent = ((gql.remaining / gql.limit) * 100).toFixed(2);
    console.log(this.colorize(`\nGraphQL API:`, 'bold'));
    console.log(`  ${gqlHealth.emoji} Remaining: ${gql.remaining}/${gql.limit} points`);
    console.log(`  Percentage: ${gqlPercent}%`);
    console.log(`  Reset time: ${new Date(gql.reset * 1000).toLocaleString()}`);
    console.log(`  Time remaining: ${this.formatTimeRemaining(gql.reset * 1000)}\n`);

    return limits;
  }

  /**
   * Monitor rate limits continuously
   */
  async monitor(interval = 5 * 60 * 1000) {
    console.log(this.colorize('Starting continuous monitoring (Press Ctrl+C to stop)...\n', 'blue'));
    
    const displayOnce = async () => {
      try {
        await this.displayLimits();
      } catch (err) {
        console.error(this.colorize(`Error: ${err.message}`, 'red'));
      }
    };

    await displayOnce();
    setInterval(displayOnce, interval);
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForReset(pollInterval = 30 * 1000) {
    console.log(this.colorize('Checking rate limit status...\n', 'blue'));
    
    let isRateLimited = false;
    let resetTime = null;

    const checkOnce = async () => {
      try {
        const limits = await this.checkRateLimits();
        const core = limits.rest.core;
        
        if (core.remaining === 0) {
          if (!isRateLimited) {
            isRateLimited = true;
            resetTime = core.reset * 1000;
            console.log(this.colorize(`Rate limit exhausted. Waiting for reset...`, 'red'));
            console.log(`Reset time: ${new Date(resetTime).toLocaleString()}`);
          }
          console.log(`Time remaining: ${this.formatTimeRemaining(resetTime)}...`);
          return false;
        } else {
          if (isRateLimited) {
            console.log(this.colorize(`\n✓ Rate limit has been reset!`, 'green'));
            console.log(`Remaining: ${core.remaining}/${core.limit} requests\n`);
            return true;
          }
          console.log(this.colorize(`✓ Rate limit is healthy`, 'green'));
          console.log(`Remaining: ${core.remaining}/${core.limit} requests\n`);
          return true;
        }
      } catch (err) {
        console.error(this.colorize(`Error: ${err.message}`, 'red'));
        return false;
      }
    };

    return new Promise(resolve => {
      const interval = setInterval(async () => {
        const isDone = await checkOnce();
        if (isDone) {
          clearInterval(interval);
          resolve();
        }
      }, pollInterval);
    });
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations() {
    const limits = await this.checkRateLimits();
    const core = limits.rest.core;
    const gql = limits.graphql;

    console.log(this.colorize('\n💡 GitHub API Optimization Recommendations\n', 'blue'));

    const corePercent = (core.remaining / core.limit) * 100;
    const gqlPercent = (gql.remaining / gql.limit) * 100;

    if (corePercent < 20) {
      console.log(this.colorize('⚠ WARNING: Low REST API quota remaining!', 'red'));
      console.log('  → Use GraphQL API for batch operations');
      console.log('  → Implement conditional requests (ETags)');
      console.log('  → Cache responses locally\n');
    }

    if (gqlPercent > 80) {
      console.log(this.colorize('✓ GraphQL API has good quota remaining', 'green'));
      console.log('  → Preferred for batch operations');
      console.log('  → More efficient than multiple REST calls\n');
    }

    console.log(this.colorize('💡 Best Practices:', 'blue'));
    console.log('  1. Use GraphQL for multiple resource queries');
    console.log('  2. Implement conditional requests with ETags');
    console.log('  3. Cache responses when possible');
    console.log('  4. Batch multiple operations together');
    console.log('  5. Use pagination efficiently');
    console.log('  6. Monitor rate limits before bulk operations');
    console.log('  7. Implement exponential backoff for retries');
    console.log('  8. Consider using GitHub Apps (higher limits)');
    console.log('  9. Use multi-token approach for teams');
    console.log('  10. Schedule heavy operations during off-peak times\n');

    return { core, gql, recommendations: true };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('Error: GITHUB_TOKEN environment variable not set');
      console.error('Set it with: export GITHUB_TOKEN="your_token"');
      process.exit(1);
    }

    const monitor = new GitHubRateLimitMonitor(token);
    const args = process.argv.slice(2);

    if (args.includes('--check')) {
      const jsonOutput = args.includes('--json');
      await monitor.displayLimits(jsonOutput);
    } else if (args.includes('--monitor')) {
      await monitor.monitor();
    } else if (args.includes('--wait')) {
      await monitor.waitForReset();
    } else if (args.includes('--recommendations')) {
      await monitor.getRecommendations();
    } else {
      await monitor.displayLimits();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = GitHubRateLimitMonitor;
