/**
 * NotificationService - Multi-channel notification system
 * Supports email, push notifications, and in-app notifications
 */

const EventEmitter = require('events')

class NotificationService extends EventEmitter {
  constructor () {
    super()
    this.channels = new Map()
    this.preferences = new Map()
    this.queue = []
    this.processing = false
  }

  /**
   * Register a notification channel
   * @param {string} name - Channel name (email, push, in-app, etc.)
   * @param {Function} handler - Channel handler function
   */
  registerChannel (name, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Channel handler must be a function')
    }

    this.channels.set(name, {
      name,
      handler,
      enabled: true,
      sentCount: 0,
      failedCount: 0
    })

    this.emit('channel:registered', { name })
  }

  /**
   * Unregister a notification channel
   * @param {string} name - Channel name
   */
  unregisterChannel (name) {
    const removed = this.channels.delete(name)
    if (removed) {
      this.emit('channel:unregistered', { name })
    }
    return removed
  }

  /**
   * Set user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Channel preferences
   */
  setPreferences (userId, preferences) {
    this.preferences.set(userId, {
      ...preferences,
      updatedAt: new Date().toISOString()
    })
    this.emit('preferences:updated', { userId, preferences })
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Object} User preferences
   */
  getPreferences (userId) {
    return (
      this.preferences.get(userId) || {
        email: true,
        push: true,
        'in-app': true
      }
    )
  }

  /**
   * Send notification to user
   * @param {string} userId - User ID
   * @param {Object} message - Notification message
   * @param {Array<string>} channels - Channels to use (optional)
   * @returns {Promise<Array>} Delivery results
   */
  async notify (userId, message, channels = null) {
    const userPreferences = this.getPreferences(userId)

    // Determine which channels to use
    let targetChannels = channels || ['email', 'in-app']

    // Filter based on user preferences
    targetChannels = targetChannels.filter((channel) => {
      const channelConfig = this.channels.get(channel)
      return (
        channelConfig &&
        channelConfig.enabled &&
        userPreferences[channel] !== false
      )
    })

    if (targetChannels.length === 0) {
      this.emit('notification:skipped', {
        userId,
        message,
        reason: 'No enabled channels'
      })
      return []
    }

    // Prepare notification
    const notification = {
      id: this._generateId(),
      userId,
      message: {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      },
      channels: targetChannels,
      status: 'pending'
    }

    // Send to each channel
    const promises = targetChannels.map(async (channelName) => {
      const channel = this.channels.get(channelName)

      try {
        await channel.handler(userId, notification.message)
        channel.sentCount++

        this.emit('notification:sent', {
          userId,
          channel: channelName,
          notificationId: notification.id
        })

        return {
          channel: channelName,
          success: true,
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        channel.failedCount++

        this.emit('notification:failed', {
          userId,
          channel: channelName,
          error: error.message,
          notificationId: notification.id
        })

        return {
          channel: channelName,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    })

    const results = await Promise.all(promises)
    notification.status = results.every((r) => r.success)
      ? 'delivered'
      : 'partial'

    this.emit('notification:completed', { notification, results })

    return results
  }

  /**
   * Send bulk notifications
   * @param {Array<Object>} notifications - Array of {userId, message, channels}
   * @returns {Promise<Array>} All delivery results
   */
  async notifyBulk (notifications) {
    const results = []

    for (const notif of notifications) {
      const result = await this.notify(
        notif.userId,
        notif.message,
        notif.channels
      )
      results.push({ userId: notif.userId, results: result })
    }

    return results
  }

  /**
   * Get channel statistics
   * @returns {Object} Statistics for all channels
   */
  getStats () {
    const stats = {}

    for (const [name, channel] of this.channels) {
      stats[name] = {
        enabled: channel.enabled,
        sentCount: channel.sentCount,
        failedCount: channel.failedCount,
        successRate:
          channel.sentCount > 0
            ? (
                (channel.sentCount /
                  (channel.sentCount + channel.failedCount)) *
                100
              ).toFixed(2) + '%'
            : 'N/A'
      }
    }

    return stats
  }

  /**
   * Enable/disable a channel
   * @param {string} name - Channel name
   * @param {boolean} enabled - Enable status
   */
  setChannelStatus (name, enabled) {
    const channel = this.channels.get(name)

    if (!channel) {
      throw new Error(`Channel '${name}' not found`)
    }

    channel.enabled = enabled
    this.emit('channel:status_changed', { name, enabled })
  }

  /**
   * Private: Generate notification ID
   */
  _generateId () {
    return (
      'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    )
  }
}

// Example channel handlers
const exampleHandlers = {
  /**
   * Email notification handler
   */
  email: async (userId, message) => {
    // Implement email sending logic here
    console.log(`[Email] Sending to user ${userId}:`, message.title)
    // await emailService.send(userId, message);
  },

  /**
   * Push notification handler
   */
  push: async (userId, message) => {
    // Implement push notification logic here
    console.log(`[Push] Sending to user ${userId}:`, message.title)
    // await pushService.send(userId, message);
  },

  /**
   * In-app notification handler
   */
  'in-app': async (userId, message) => {
    // Implement in-app notification logic here
    console.log(`[In-App] Sending to user ${userId}:`, message.title)
    // await database.notifications.create({ userId, ...message });
  }
}

module.exports = NotificationService
module.exports.exampleHandlers = exampleHandlers
