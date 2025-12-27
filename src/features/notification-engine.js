/**
 * Real-time Notification Engine (Feature #19)
 * Manages real-time notifications via WebSocket, email, SMS, push
 */

const crypto = require('crypto');

class NotificationEngine {
  constructor(options = {}) {
    this.channels = options.channels || ['email', 'sms', 'push', 'websocket'];
    this.notifications = new Map();
    this.subscribers = new Map();
    this.providers = new Map();
  }

  /**
   * Register notification provider
   */
  registerProvider(channel, provider) {
    if (typeof provider.send !== 'function') {
      throw new Error('Provider must have send method');
    }
    this.providers.set(channel, provider);
  }

  /**
   * Subscribe to notifications
   */
  subscribe(userId, channels = this.channels) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }

    const userChannels = this.subscribers.get(userId);
    channels.forEach((c) => userChannels.add(c));

    return {
      userId,
      channels: Array.from(userChannels),
    };
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(userId, channels = this.channels) {
    const userChannels = this.subscribers.get(userId);
    if (userChannels) {
      channels.forEach((c) => userChannels.delete(c));
    }
  }

  /**
   * Send notification
   */
  async notify(userId, title, message, options = {}) {
    const notification = {
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      type: options.type || 'info',
      channels: options.channels || this.channels,
      metadata: options.metadata || {},
      createdAt: new Date(),
      sentAt: new Map(),
      status: 'pending',
    };

    this.notifications.set(notification.id, notification);

    // Send through subscribed channels
    const userChannels = this.subscribers.get(userId) || new Set();
    const channelsToUse = notification.channels.filter((c) =>
      userChannels.has(c)
    );

    const results = await Promise.allSettled(
      channelsToUse.map((channel) => this.sendViaChannel(notification, channel))
    );

    notification.status = results.some((r) => r.status === 'fulfilled')
      ? 'sent'
      : 'failed';

    return notification;
  }

  /**
   * Send via specific channel
   */
  async sendViaChannel(notification, channel) {
    const provider = this.providers.get(channel);
    if (!provider) {
      return null;
    }

    try {
      const result = await provider.send({
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
      });

      notification.sentAt.set(channel, new Date());
      return result;
    } catch (error) {
      console.error(`Error sending via ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get notification
   */
  getNotification(notificationId) {
    return this.notifications.get(notificationId);
  }

  /**
   * Mark as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.readAt = new Date();
    }
    return notification;
  }
}

module.exports = NotificationEngine;
