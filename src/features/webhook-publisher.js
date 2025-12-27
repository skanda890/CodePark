/**
 * Webhook Event Publisher (Feature #17)
 * Publishes events to webhooks
 */

const crypto = require('crypto');
const axios = require('axios');

class WebhookPublisher {
  constructor(options = {}) {
    this.webhooks = new Map();
    this.events = [];
    this.retryPolicy = options.retryPolicy || { maxRetries: 3, delayMs: 1000 };
  }

  /**
   * Register webhook
   */
  registerWebhook(name, url, events, options = {}) {
    const webhook = {
      id: crypto.randomUUID(),
      name,
      url,
      events,
      active: options.active !== false,
      secret: options.secret || crypto.randomBytes(32).toString('hex'),
      createdAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  /**
   * Publish event
   */
  async publish(eventType, data, metadata = {}) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      data,
      metadata,
      timestamp: new Date(),
    };

    this.events.push(event);

    // Find matching webhooks
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(
      (w) => w.active && w.events.includes(eventType)
    );

    // Deliver to all matching webhooks
    const deliveries = matchingWebhooks.map((webhook) =>
      this.deliverWebhook(webhook, event)
    );

    return Promise.allSettled(deliveries);
  }

  /**
   * Deliver webhook with retry
   */
  async deliverWebhook(webhook, event, attempt = 0) {
    try {
      const signature = this.createSignature(event, webhook.secret);

      const response = await axios.post(webhook.url, event, {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': webhook.id,
          'X-Event-Type': event.type,
        },
        timeout: 5000,
      });

      return { success: true, statusCode: response.status };
    } catch (error) {
      if (attempt < this.retryPolicy.maxRetries) {
        // Retry
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryPolicy.delayMs * (attempt + 1))
        );
        return this.deliverWebhook(webhook, event, attempt + 1);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Create HMAC signature
   */
  createSignature(event, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(event))
      .digest('hex');
  }

  /**
   * List webhooks
   */
  listWebhooks() {
    return Array.from(this.webhooks.values());
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId) {
    return this.webhooks.delete(webhookId);
  }
}

module.exports = WebhookPublisher;
