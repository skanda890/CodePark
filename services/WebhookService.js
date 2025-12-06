/**
 * WebhookService - Webhook Management System
 * Implements webhook CRUD operations and event dispatching
 */

const axios = require('axios')
const crypto = require('crypto')
const EventEmitter = require('events')
const dns = require('dns').promises
const net = require('net')

class WebhookService extends EventEmitter {
  constructor (options = {}) {
    super()
    this.options = {
      timeout: options.timeout || 5000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      secretKey: options.secretKey || process.env.WEBHOOK_SECRET_KEY,
      ...options
    }

    this.webhooks = new Map()
    this.deliveryQueue = []
  }

  /**
   * Create a new webhook
   * @param {Object} webhookData - Webhook configuration
   * @returns {Object} Created webhook
   */
  async create (webhookData) {
    const webhook = {
      id: this._generateId(),
      url: webhookData.url,
      events: webhookData.events || [],
      active: webhookData.active !== false,
      secret: webhookData.secret || this._generateSecret(),
      metadata: webhookData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryCount: 0,
      lastDeliveryAt: null,
      lastDeliveryStatus: null
    }

    // Await async validation
    if (!(await this._validateWebhook(webhook))) {
      throw new Error('Invalid webhook configuration')
    }

    this.webhooks.set(webhook.id, webhook)
    this.emit('webhook:created', webhook)

    return webhook
  }

  /**
   * Get webhook by ID
   * @param {string} id - Webhook ID
   * @returns {Object|null} Webhook or null if not found
   */
  get (id) {
    return this.webhooks.get(id) || null
  }

  /**
   * List all webhooks
   * @param {Object} filters - Filter options
   * @returns {Array} Webhooks matching filters
   */
  list (filters = {}) {
    let webhooks = Array.from(this.webhooks.values())

    if (filters.active !== undefined) {
      webhooks = webhooks.filter((w) => w.active === filters.active)
    }

    if (filters.event) {
      webhooks = webhooks.filter((w) => w.events.includes(filters.event))
    }

    return webhooks
  }

  /**
   * Update webhook
   * @param {string} id - Webhook ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated webhook
   */
  async update (id, updates) {
    const webhook = this.webhooks.get(id)

    if (!webhook) {
      throw new Error(`Webhook '${id}' not found`)
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      id: webhook.id, // Prevent ID change
      createdAt: webhook.createdAt, // Prevent creation time change
      updatedAt: new Date().toISOString()
    }

    // Await async validation
    if (!(await this._validateWebhook(updatedWebhook))) {
      throw new Error('Invalid webhook configuration')
    }

    this.webhooks.set(id, updatedWebhook)
    this.emit('webhook:updated', updatedWebhook)

    return updatedWebhook
  }

  /**
   * Delete webhook
   * @param {string} id - Webhook ID
   * @returns {boolean} Success status
   */
  delete (id) {
    const webhook = this.webhooks.get(id)

    if (!webhook) {
      return false
    }

    this.webhooks.delete(id)
    this.emit('webhook:deleted', { id, webhook })

    return true
  }

  /**
   * Test webhook delivery
   * @param {string} id - Webhook ID
   * @returns {Promise<Object>} Delivery result
   */
  async test (id) {
    const webhook = this.webhooks.get(id)

    if (!webhook) {
      throw new Error(`Webhook '${id}' not found`)
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: id
      }
    }

    return await this._deliver(webhook, testPayload)
  }

  /**
   * Dispatch event to webhooks
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @returns {Promise<Array>} Delivery results
   */
  async dispatch (eventName, data) {
    const webhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.active && w.events.includes(eventName)
    )

    if (webhooks.length === 0) {
      return []
    }

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data
    }

    const results = await Promise.allSettled(
      webhooks.map((webhook) => this._deliver(webhook, payload))
    )

    this.emit('event:dispatched', {
      eventName,
      webhookCount: webhooks.length,
      results
    })

    return results
  }

  /**
   * Private: Deliver payload to webhook
   */
  async _deliver (webhook, payload, attempt = 1) {
    try {
      const signature = this._generateSignature(payload, webhook.secret)

      const response = await axios.post(webhook.url, payload, {
        timeout: this.options.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'CodePark-Webhook/1.0'
        }
      })

      // Update webhook stats
      webhook.deliveryCount++
      webhook.lastDeliveryAt = new Date().toISOString()
      webhook.lastDeliveryStatus = 'success'

      this.emit('webhook:delivered', {
        webhook,
        payload,
        response: response.data
      })

      return {
        success: true,
        webhookId: webhook.id,
        statusCode: response.status,
        attempt
      }
    } catch (error) {
      // Retry logic
      if (attempt < this.options.retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.options.retryDelay * attempt)
        )
        return this._deliver(webhook, payload, attempt + 1)
      }

      webhook.lastDeliveryAt = new Date().toISOString()
      webhook.lastDeliveryStatus = 'failed'

      this.emit('webhook:failed', { webhook, payload, error: error.message })

      return {
        success: false,
        webhookId: webhook.id,
        error: error.message,
        attempt
      }
    }
  }

  /**
   * Private: Validate webhook configuration
   */
  async _validateWebhook (webhook) {
    if (!webhook.url || typeof webhook.url !== 'string') {
      return false
    }

    let parsed
    try {
      parsed = new URL(webhook.url)
    } catch {
      return false
    }

    // Protocol restriction
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false
    }

    // SSRF defense: disallow localhost, loopback, and private networks
    const allowedProtocols = ['https:', 'http:']
    if (!(await this._isAllowedWebhookUrl(parsed))) {
      return false
    }

    if (!Array.isArray(webhook.events)) {
      return false
    }

    return true
  }

  /**
   * Private: Generate webhook ID
   */
  _generateId () {
    return 'wh_' + crypto.randomBytes(16).toString('hex')
  }

  /**
   * Private: Generate webhook secret
   */
  _generateSecret () {
    return crypto.randomBytes(32).toString('hex')
  }
  /**
   * SSRF defense for webhook URLs
   * Returns true if the hostname resolves to public IP and is not localhost, loopback, or private
   */
  async _isAllowedWebhookUrl(parsedUrl) {
    const hostname = parsedUrl.hostname
    // Disallow any localhost-style names
    const forbiddenHostnames = new Set(['localhost', '127.0.0.1', '::1'])
    if (forbiddenHostnames.has(hostname)) {
      return false
    }

    // If it's already an IP, check address type
    if (net.isIP(hostname)) {
      if (this._isForbiddenAddress(hostname)) {
        return false
      }
      return true
    }

    // Otherwise, resolve all addresses for the hostname and check them
    try {
      const addresses = await dns.lookup(hostname, { all: true })
      for (const addr of addresses) {
        if (this._isForbiddenAddress(addr.address)) {
          return false
        }
      }
    } catch (e) {
      // DNS errors mean we treat as invalid
      return false
    }
    return true
  }

  _isForbiddenAddress(ip) {
    // IPv4
    if (net.isIPv4(ip)) {
      // 127.0.0.0/8 loopback
      if (ip.startsWith('127.')) return true
      // 10.0.0.0/8 private
      if (ip.startsWith('10.')) return true
      // 172.16.0.0 - 172.31.255.255 private
      const first = Number(ip.split('.')[0])
      const second = Number(ip.split('.')[1])
      if (first === 172 && second >= 16 && second <= 31) return true
      // 192.168.0.0/16 private
      if (ip.startsWith('192.168.')) return true
      // 169.254.0.0/16 link-local
      if (ip.startsWith('169.254.')) return true
    }
    // IPv6
    if (net.isIPv6(ip)) {
      // ::1/128 loopback
      if (ip === '::1') return true
      // fc00::/7 unique local address
      if (ip.startsWith('fc') || ip.startsWith('fd')) return true
      // fe80::/10 link-local
      if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) return true
    }
    return false
  }

  /**
   * Private: Generate HMAC signature for payload
   */
  _generateSignature (payload, secret) {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return hmac.digest('hex')
  }
}

module.exports = WebhookService
