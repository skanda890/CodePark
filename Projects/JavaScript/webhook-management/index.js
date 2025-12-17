const axios = require('axios');
const EventEmitter = require('events');

class WebhookManager extends EventEmitter {
  constructor() {
    super();
    this.webhooks = new Map();
    this.deliveryHistory = [];
  }

  async registerWebhook(url, events, options = {}) {
    const id = Math.random().toString(36).substring(7);
    const webhook = {
      id,
      url,
      events,
      active: true,
      createdAt: new Date(),
      retries: options.retries || 3,
      timeout: options.timeout || 5000,
      secret: options.secret || null
    };
    this.webhooks.set(id, webhook);
    console.log(`Webhook registered: ${id}`);
    return webhook;
  }

  async triggerEvent(eventName, data) {
    const webhooksToCall = Array.from(this.webhooks.values())
      .filter(w => w.active && w.events.includes(eventName));

    for (const webhook of webhooksToCall) {
      this.deliverWebhook(webhook, eventName, data);
    }
  }

  async deliverWebhook(webhook, eventName, data, retryCount = 0) {
    try {
      const payload = {
        event: eventName,
        data,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(webhook.url, payload, {
        timeout: webhook.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': eventName,
          'X-Webhook-ID': webhook.id
        }
      });

      this.recordDelivery(webhook.id, eventName, true, response.status);
      console.log(`Webhook delivered: ${webhook.id}`);
    } catch (error) {
      if (retryCount < webhook.retries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setTimeout(() => this.deliverWebhook(webhook, eventName, data, retryCount + 1), delay);
      } else {
        this.recordDelivery(webhook.id, eventName, false, error.message);
        console.error(`Webhook failed: ${webhook.id} - ${error.message}`);
      }
    }
  }

  recordDelivery(webhookId, event, success, response) {
    this.deliveryHistory.push({
      webhookId,
      event,
      success,
      response,
      timestamp: new Date()
    });
  }

  async testWebhook(id) {
    const webhook = this.webhooks.get(id);
    if (!webhook) return { error: 'Webhook not found' };
    
    await this.deliverWebhook(webhook, 'test', { message: 'Test webhook' });
    return { success: true };
  }

  getWebhook(id) {
    return this.webhooks.get(id);
  }

  listWebhooks() {
    return Array.from(this.webhooks.values());
  }

  async deleteWebhook(id) {
    return this.webhooks.delete(id);
  }
}

module.exports = WebhookManager;
