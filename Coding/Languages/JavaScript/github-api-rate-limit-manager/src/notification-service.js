/**
 * Notification Service for GitHub API Rate Limit Manager
 * 
 * Features:
 * - Slack webhook integration
 * - Discord webhook integration
 * - Multiple alert types (warning, critical, reset, rotation, error)
 * - Notification deduplication
 * - Exponential backoff retry mechanism
 */

const https = require('https');
const crypto = require('crypto');

class NotificationService {
  constructor(config = {}) {
    this.slackWebhook = config.slackWebhook;
    this.discordWebhook = config.discordWebhook;
    this.emailConfig = config.email;
    
    // Deduplication cache
    this.sentNotifications = new Map();
    this.deduplicationWindow = config.deduplicationWindow || 300000; // 5 minutes
    
    // Retry configuration
    this.maxRetries = config.maxRetries || 3;
    this.baseBackoffMs = config.baseBackoffMs || 1000;
    
    // Notification history
    this.notificationHistory = [];
    this.maxHistorySize = config.maxHistorySize || 500;
  }

  /**
   * Generate notification hash for deduplication
   */
  generateHash(type, data) {
    const content = JSON.stringify({ type, data });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if notification should be sent (deduplication)
   */
  shouldSendNotification(type, data) {
    const hash = this.generateHash(type, data);
    
    if (this.sentNotifications.has(hash)) {
      const lastSent = this.sentNotifications.get(hash);
      if (Date.now() - lastSent < this.deduplicationWindow) {
        return false;
      }
    }
    
    this.sentNotifications.set(hash, Date.now());
    return true;
  }

  /**
   * Clean expired deduplication entries
   */
  cleanupDeduplicationCache() {
    const now = Date.now();
    for (const [hash, timestamp] of this.sentNotifications.entries()) {
      if (now - timestamp > this.deduplicationWindow) {
        this.sentNotifications.delete(hash);
      }
    }
  }

  /**
   * Send notification with exponential backoff retry
   */
  async sendWithRetry(platform, payload, attempt = 0) {
    try {
      const result = await this.send(platform, payload);
      return result;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delayMs = this.baseBackoffMs * Math.pow(2, attempt);
        await this.delay(delayMs);
        return this.sendWithRetry(platform, payload, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Send notification to platform
   */
  async send(platform, payload) {
    const webhook = platform === 'slack' ? this.slackWebhook : this.discordWebhook;
    
    if (!webhook) {
      throw new Error(`${platform} webhook not configured`);
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = new URL(webhook);
      
      const req = https.request({
        method: 'POST',
        hostname: options.hostname,
        path: options.pathname + options.search,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Format Slack message
   */
  formatSlackMessage(type, data) {
    const colors = {
      warning: '#FFA500',
      critical: '#FF0000',
      reset: '#00FF00',
      rotation: '#0099FF',
      error: '#FF4500'
    };

    const titles = {
      warning: '⚠️ Rate Limit Warning',
      critical: '🚨 Critical Rate Limit Alert',
      reset: '✅ Rate Limit Reset',
      rotation: '🔄 Token Rotation',
      error: '❌ Error Alert'
    };

    return {
      attachments: [{
        color: colors[type] || '#808080',
        title: titles[type] || 'GitHub API Alert',
        fields: this.formatFields(type, data),
        ts: Math.floor(Date.now() / 1000)
      }]
    };
  }

  /**
   * Format Discord message
   */
  formatDiscordMessage(type, data) {
    const colors = {
      warning: 0xFFA500,
      critical: 0xFF0000,
      reset: 0x00FF00,
      rotation: 0x0099FF,
      error: 0xFF4500
    };

    const icons = {
      warning: '⚠️',
      critical: '🚨',
      reset: '✅',
      rotation: '🔄',
      error: '❌'
    };

    return {
      embeds: [{
        color: colors[type] || 0x808080,
        title: `${icons[type]} GitHub API Alert`,
        fields: this.formatFields(type, data),
        timestamp: new Date().toISOString()
      }]
    };
  }

  /**
   * Format notification fields
   */
  formatFields(type, data) {
    const fields = [];

    switch (type) {
      case 'warning':
        fields.push(
          { title: 'Remaining Requests', value: data.remaining.toString(), short: true },
          { title: 'Limit', value: data.limit.toString(), short: true },
          { title: 'Percentage Used', value: `${data.percentage}%`, short: true },
          { title: 'Reset Time', value: data.resetTime, short: true },
          { title: 'Recommendation', value: data.recommendation }
        );
        break;

      case 'critical':
        fields.push(
          { title: 'Severity', value: 'CRITICAL', short: true },
          { title: 'Remaining Requests', value: data.remaining.toString(), short: true },
          { title: 'Action Required', value: data.action }
        );
        break;

      case 'reset':
        fields.push(
          { title: 'API Type', value: data.apiType, short: true },
          { title: 'New Limit', value: data.limit.toString(), short: true },
          { title: 'Reset Time', value: new Date().toISOString() }
        );
        break;

      case 'rotation':
        fields.push(
          { title: 'Previous Token', value: `Token #${data.previousTokenId}`, short: true },
          { title: 'New Token', value: `Token #${data.newTokenId}`, short: true },
          { title: 'Previous Health', value: `${data.previousHealth}%`, short: true },
          { title: 'New Health', value: `${data.newHealth}%`, short: true },
          { title: 'Reason', value: data.reason }
        );
        break;

      case 'error':
        fields.push(
          { title: 'Error Type', value: data.errorType, short: true },
          { title: 'Status Code', value: data.statusCode?.toString() || 'N/A', short: true },
          { title: 'Message', value: data.message },
          { title: 'Timestamp', value: new Date().toISOString() }
        );
        break;
    }

    return fields;
  }

  /**
   * Send rate limit warning
   */
  async notifyWarning(data) {
    if (!this.shouldSendNotification('warning', data)) {
      return { deduped: true };
    }

    const promises = [];

    if (this.slackWebhook) {
      const payload = this.formatSlackMessage('warning', data);
      promises.push(this.sendWithRetry('slack', payload).catch(e => ({ error: e.message })));
    }

    if (this.discordWebhook) {
      const payload = this.formatDiscordMessage('warning', data);
      promises.push(this.sendWithRetry('discord', payload).catch(e => ({ error: e.message })));
    }

    const results = await Promise.all(promises);
    this.recordNotification('warning', data, results);
    return results;
  }

  /**
   * Send critical alert
   */
  async notifyCritical(data) {
    if (!this.shouldSendNotification('critical', data)) {
      return { deduped: true };
    }

    const promises = [];

    if (this.slackWebhook) {
      const payload = this.formatSlackMessage('critical', data);
      promises.push(this.sendWithRetry('slack', payload).catch(e => ({ error: e.message })));
    }

    if (this.discordWebhook) {
      const payload = this.formatDiscordMessage('critical', data);
      promises.push(this.sendWithRetry('discord', payload).catch(e => ({ error: e.message })));
    }

    const results = await Promise.all(promises);
    this.recordNotification('critical', data, results);
    return results;
  }

  /**
   * Send reset notification
   */
  async notifyReset(data) {
    const promises = [];

    if (this.slackWebhook) {
      const payload = this.formatSlackMessage('reset', data);
      promises.push(this.sendWithRetry('slack', payload).catch(e => ({ error: e.message })));
    }

    if (this.discordWebhook) {
      const payload = this.formatDiscordMessage('reset', data);
      promises.push(this.sendWithRetry('discord', payload).catch(e => ({ error: e.message })));
    }

    const results = await Promise.all(promises);
    this.recordNotification('reset', data, results);
    return results;
  }

  /**
   * Send token rotation notification
   */
  async notifyRotation(data) {
    if (!this.shouldSendNotification('rotation', data)) {
      return { deduped: true };
    }

    const promises = [];

    if (this.slackWebhook) {
      const payload = this.formatSlackMessage('rotation', data);
      promises.push(this.sendWithRetry('slack', payload).catch(e => ({ error: e.message })));
    }

    if (this.discordWebhook) {
      const payload = this.formatDiscordMessage('rotation', data);
      promises.push(this.sendWithRetry('discord', payload).catch(e => ({ error: e.message })));
    }

    const results = await Promise.all(promises);
    this.recordNotification('rotation', data, results);
    return results;
  }

  /**
   * Send error notification
   */
  async notifyError(data) {
    const promises = [];

    if (this.slackWebhook) {
      const payload = this.formatSlackMessage('error', data);
      promises.push(this.sendWithRetry('slack', payload).catch(e => ({ error: e.message })));
    }

    if (this.discordWebhook) {
      const payload = this.formatDiscordMessage('error', data);
      promises.push(this.sendWithRetry('discord', payload).catch(e => ({ error: e.message })));
    }

    const results = await Promise.all(promises);
    this.recordNotification('error', data, results);
    return results;
  }

  /**
   * Record notification in history
   */
  recordNotification(type, data, results) {
    this.notificationHistory.push({
      type,
      data,
      results,
      timestamp: new Date()
    });

    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory.shift();
    }
  }

  /**
   * Get notification history
   */
  getHistory(limit = 50) {
    return this.notificationHistory.slice(-limit).reverse();
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NotificationService;
