/**
 * WebhookService - Webhook Management System
 * Implements webhook CRUD operations and event dispatching
 */

const axios = require('axios');
const crypto = require('crypto');
const EventEmitter = require('events');

class WebhookService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      timeout: options.timeout || 5000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      secretKey: options.secretKey || process.env.WEBHOOK_SECRET_KEY,
      ...options
    };

    this.webhooks = new Map();
    this.deliveryQueue = [];
  }

  /**
   * Create a new webhook
   * @param {Object} webhookData - Webhook configuration
   * @returns {Object} Created webhook
   */
  create(webhookData) {
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
    };

    if (!this._validateWebhook(webhook)) {
      throw new Error('Invalid webhook configuration');
    }

    this.webhooks.set(webhook.id, webhook);
    this.emit('webhook:created', webhook);

    return webhook;
  }

  /**
   * Get webhook by ID
   * @param {string} id - Webhook ID
   * @returns {Object|null} Webhook or null if not found
   */
  get(id) {
    return this.webhooks.get(id) || null;
  }

  /**
   * List all webhooks
   * @param {Object} filters - Filter options
   * @returns {Array} Webhooks matching filters
   */
  list(filters = {}) {
    let webhooks = Array.from(this.webhooks.values());

    if (filters.active !== undefined) {
      webhooks = webhooks.filter(w => w.active === filters.active);
    }

    if (filters.event) {
      webhooks = webhooks.filter(w => w.events.includes(filters.event));
    }

    return webhooks;
  }

  /**
   * Update webhook
   * @param {string} id - Webhook ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated webhook
   */
  update(id, updates) {
    const webhook = this.webhooks.get(id);
    
    if (!webhook) {
      throw new Error(`Webhook '${id}' not found`);
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      id: webhook.id, // Prevent ID change
      createdAt: webhook.createdAt, // Prevent creation time change
      updatedAt: new Date().toISOString()
    };

    if (!this._validateWebhook(updatedWebhook)) {
      throw new Error('Invalid webhook configuration');
    }

    this.webhooks.set(id, updatedWebhook);
    this.emit('webhook:updated', updatedWebhook);

    return updatedWebhook;
  }

  /**
   * Delete webhook
   * @param {string} id - Webhook ID
   * @returns {boolean} Success status
   */
  delete(id) {
    const webhook = this.webhooks.get(id);
    
    if (!webhook) {
      return false;
    }

    this.webhooks.delete(id);
    this.emit('webhook:deleted', { id, webhook });

    return true;
  }

  /**
   * Test webhook delivery
   * @param {string} id - Webhook ID
   * @returns {Promise<Object>} Delivery result
   */
  async test(id) {
    const webhook = this.webhooks.get(id);
    
    if (!webhook) {
      throw new Error(`Webhook '${id}' not found`);
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: id
      }
    };

    return await this._deliver(webhook, testPayload);
  }

  /**
   * Dispatch event to webhooks
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @returns {Promise<Array>} Delivery results
   */
  async dispatch(eventName, data) {
    const webhooks = Array.from(this.webhooks.values())
      .filter(w => w.active && w.events.includes(eventName));

    if (webhooks.length === 0) {
      return [];
    }

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data
    };

    const results = await Promise.allSettled(
      webhooks.map(webhook => this._deliver(webhook, payload))
    );

    this.emit('event:dispatched', { eventName, webhookCount: webhooks.length, results });

    return results;
  }

  /**
   * Private: Deliver payload to webhook
   */
  async _deliver(webhook, payload, attempt = 1) {
    try {
      const signature = this._generateSignature(payload, webhook.secret);

      const response = await axios.post(webhook.url, payload, {
        timeout: this.options.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'CodePark-Webhook/1.0'
        }
      });

      // Update webhook stats
      webhook.deliveryCount++;
      webhook.lastDeliveryAt = new Date().toISOString();
      webhook.lastDeliveryStatus = 'success';

      this.emit('webhook:delivered', { webhook, payload, response: response.data });

      return {
        success: true,
        webhookId: webhook.id,
        statusCode: response.status,
        attempt
      };

    } catch (error) {
      // Retry logic
      if (attempt < this.options.retries) {
        await new Promise(resolve => 
          setTimeout(resolve, this.options.retryDelay * attempt)
        );
        return this._deliver(webhook, payload, attempt + 1);
      }

      webhook.lastDeliveryAt = new Date().toISOString();
      webhook.lastDeliveryStatus = 'failed';

      this.emit('webhook:failed', { webhook, payload, error: error.message });

      return {
        success: false,
        webhookId: webhook.id,
        error: error.message,
        attempt
      };
    }
  }

  /**
   * Private: Validate webhook configuration
   */
  _validateWebhook(webhook) {
    if (!webhook.url || typeof webhook.url !== 'string') {
      return false;
    }

    try {
      new URL(webhook.url);
    } catch {
      return false;
    }

    if (!Array.isArray(webhook.events)) {
      return false;
    }

    return true;
  }

  /**
   * Private: Generate webhook ID
   */
  _generateId() {
    return 'wh_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Private: Generate webhook secret
   */
  _generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Private: Generate HMAC signature for payload
   */
  _generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}

module.exports = WebhookService;
