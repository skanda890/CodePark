/**
 * GitHub App Manager for GitHub API Rate Limit Manager
 *
 * Features:
 * - JWT token generation
 * - Installation token management
 * - Automatic token refresh with TTL caching
 * - Webhook signature verification
 * - Higher rate limits support (10,000/hour vs 5,000)
 * - Organization and Enterprise support
 */

const crypto = require('crypto')

class GitHubAppManager {
  constructor (config = {}) {
    this.appId = config.appId
    this.privateKey = config.privateKey
    this.webhookSecret = config.webhookSecret

    // Token cache
    this.tokenCache = new Map()
    this.tokenTTL = config.tokenTTL || 3600000 // 1 hour

    // Rate limit info
    this.rateLimit = {
      core: 10000, // GitHub App has 10,000 req/hour
      search: 30, // Search still has 30 req/minute
      graphql: 5000 // GraphQL has 5000 points/hour
    }

    this.stats = {
      tokenGenerations: 0,
      tokenRefreshes: 0,
      webhookVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0
    }
  }

  /**
   * Generate JWT token for GitHub App
   */
  generateJWT () {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iat: now,
      exp: now + 600, // 10 minutes
      iss: this.appId
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    // Create JWT
    const headerEncoded = this.base64urlEscape(
      Buffer.from(JSON.stringify(header)).toString('base64')
    )
    const payloadEncoded = this.base64urlEscape(
      Buffer.from(JSON.stringify(payload)).toString('base64')
    )

    const signature = this.signMessage(
      `${headerEncoded}.${payloadEncoded}`,
      this.privateKey
    )

    this.stats.tokenGenerations++

    return `${headerEncoded}.${payloadEncoded}.${signature}`
  }

  /**
   * Get installation token (with caching)
   */
  async getInstallationToken (installationId, options = {}) {
    const cacheKey = `inst_${installationId}`

    // Check cache
    if (this.tokenCache.has(cacheKey)) {
      const cached = this.tokenCache.get(cacheKey)
      if (Date.now() < cached.expiresAt) {
        return cached.token
      } else {
        this.tokenCache.delete(cacheKey)
      }
    }

    // Generate new token (in real use, this would call GitHub API)
    const jwt = this.generateJWT()
    const token = {
      token: jwt,
      expiresAt: Date.now() + this.tokenTTL,
      installationId,
      permissions: options.permissions || [],
      repositories: options.repositories || []
    }

    this.tokenCache.set(cacheKey, token)
    this.stats.tokenRefreshes++

    return token
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature (payload, signature) {
    this.stats.webhookVerifications++

    if (!signature || !this.webhookSecret) {
      this.stats.failedVerifications++
      return false
    }

    // GitHub uses HMAC-SHA256
    const hmac = crypto.createHmac('sha256', this.webhookSecret)
    hmac.update(payload)
    const expectedSignature = `sha256=${hmac.digest('hex')}`

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )

    if (isValid) {
      this.stats.successfulVerifications++
    } else {
      this.stats.failedVerifications++
    }

    return isValid
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent (event) {
    const eventType = event.action || 'unknown'

    switch (event.type) {
      case 'installation':
        return this.handleInstallationEvent(event)
      case 'installation_repositories':
        return this.handleRepositoriesEvent(event)
      case 'push':
      case 'pull_request':
      case 'issues':
        return this.handleRepositoryEvent(event)
      default:
        return { processed: false, type: event.type }
    }
  }

  /**
   * Handle installation event
   */
  handleInstallationEvent (event) {
    const action = event.action
    const installation = event.installation

    return {
      type: 'installation',
      action,
      installationId: installation.id,
      accountType: installation.account.type,
      accountLogin: installation.account.login,
      repositoriesCount: event.repositories_count,
      processed: true
    }
  }

  /**
   * Handle repositories event
   */
  handleRepositoriesEvent (event) {
    return {
      type: 'repositories',
      action: event.action,
      installationId: event.installation.id,
      repositoriesAdded: event.repositories_added?.length || 0,
      repositoriesRemoved: event.repositories_removed?.length || 0,
      processed: true
    }
  }

  /**
   * Handle repository event (push, PR, issues)
   */
  handleRepositoryEvent (event) {
    return {
      type: event.type,
      repository: event.repository?.name,
      installationId: event.installation?.id,
      processed: true
    }
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo () {
    return {
      appType: 'GitHub App',
      limits: this.rateLimit,
      advantages: [
        'Higher core API rate limit: 10,000 requests/hour (vs 5,000 for tokens)',
        'Automatic token refresh with JWT',
        'Enterprise and Organization support',
        'Webhook integration',
        'Conditional requests support',
        'Increased GraphQL limit: 5,000 points/hour'
      ]
    }
  }

  /**
   * Get cached tokens
   */
  getCachedTokens () {
    const tokens = []

    for (const [key, token] of this.tokenCache) {
      tokens.push({
        installationId: token.installationId,
        expiresIn: Math.max(0, token.expiresAt - Date.now()),
        cached: true
      })
    }

    return tokens
  }

  /**
   * Clear token cache for installation
   */
  clearTokenCache (installationId) {
    const cacheKey = `inst_${installationId}`
    const existed = this.tokenCache.has(cacheKey)
    this.tokenCache.delete(cacheKey)
    return { cleared: existed }
  }

  /**
   * Clear all token cache
   */
  clearAllTokenCache () {
    const count = this.tokenCache.size
    this.tokenCache.clear()
    return { cleared: count }
  }

  /**
   * Get statistics
   */
  getStats () {
    return {
      stats: this.stats,
      cachedTokens: this.tokenCache.size,
      successRate:
        this.stats.webhookVerifications > 0
          ? (
              (this.stats.successfulVerifications /
                this.stats.webhookVerifications) *
              100
            ).toFixed(2) + '%'
          : 'N/A'
    }
  }

  /**
   * Sign message with RSA private key
   */
  signMessage (message, privateKey) {
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(message)
    return this.base64urlEscape(sign.sign(privateKey, 'base64'))
  }

  /**
   * Base64URL escape
   */
  base64urlEscape (str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  /**
   * Validate app configuration
   */
  validateConfiguration () {
    const issues = []

    if (!this.appId) issues.push('APP_ID not set')
    if (!this.privateKey) issues.push('PRIVATE_KEY not set')
    if (!this.webhookSecret) issues.push('WEBHOOK_SECRET not set')

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

module.exports = GitHubAppManager
