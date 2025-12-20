/**
 * GraphQL Subscriptions Handler
 * Real-time data updates via WebSocket with subscription management
 * @version 1.0.0
 */

const EventEmitter = require('events');

class GraphQLSubscriptions extends EventEmitter {
  constructor(options = {}) {
    super();
    this.subscriptions = new Map();
    this.subscribers = new Map();
    this.wsClients = new Set();
    this.messageQueue = [];
    this.maxSubscriptions = options.maxSubscriptions || 1000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.setupHeartbeat();
  }

  /**
   * Register a subscription resolver
   * @param {string} name - Subscription name
   * @param {object} resolver - Subscription resolver config
   */
  registerSubscription(name, resolver) {
    this.subscriptions.set(name, {
      subscribe: resolver.subscribe || (() => {}),
      resolve: resolver.resolve || ((value) => value),
      filter: resolver.filter || (() => true),
    });
  }

  /**
   * Subscribe to a subscription
   * @param {string} name - Subscription name
   * @param {object} args - Arguments
   * @param {WebSocket} client - WebSocket client
   * @returns {string} - Subscription ID
   */
  subscribe(name, args, client) {
    const subscription = this.subscriptions.get(name);
    if (!subscription) {
      throw new Error(`Subscription '${name}' not found`);
    }

    if (this.subscribers.size >= this.maxSubscriptions) {
      throw new Error('Max subscriptions reached');
    }

    const subscriptionId = this.generateId();
    const sub = {
      id: subscriptionId,
      name,
      args,
      client,
      active: true,
      createdAt: Date.now(),
      messageCount: 0,
    };

    this.subscribers.set(subscriptionId, sub);
    this.wsClients.add(client);

    // Start subscription
    subscription.subscribe(args, (data) => {
      this.publishToSubscription(subscriptionId, data);
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a subscription
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(subscriptionId) {
    const sub = this.subscribers.get(subscriptionId);
    if (!sub) return;

    sub.active = false;
    this.subscribers.delete(subscriptionId);
  }

  /**
   * Publish data to a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {object} data - Data to publish
   */
  publishToSubscription(subscriptionId, data) {
    const sub = this.subscribers.get(subscriptionId);
    if (!sub || !sub.active) return;

    const subscription = this.subscriptions.get(sub.name);
    if (!subscription.filter(data, sub.args)) return;

    const resolved = subscription.resolve(data);
    const message = {
      type: 'data',
      subscriptionId,
      data: resolved,
      timestamp: Date.now(),
    };

    this.sendToClient(sub.client, message);
    sub.messageCount += 1;
  }

  /**
   * Broadcast to all subscribers of a subscription
   * @param {string} name - Subscription name
   * @param {object} data - Data to broadcast
   */
  broadcast(name, data) {
    for (const [subId, sub] of this.subscribers) {
      if (sub.name === name && sub.active) {
        this.publishToSubscription(subId, data);
      }
    }
  }

  /**
   * Send message to WebSocket client
   * @private
   */
  sendToClient(client, message) {
    if (client && client.readyState === 1) {
      // WebSocket.OPEN = 1
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        this.emit('error', { client, error });
      }
    }
  }

  /**
   * Handle client connection
   * @param {WebSocket} client - WebSocket client
   */
  handleConnection(client) {
    this.wsClients.add(client);

    client.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message, client);
      } catch (error) {
        this.sendToClient(client, {
          type: 'error',
          message: 'Invalid message format',
        });
      }
    });

    client.on('close', () => {
      this.handleDisconnect(client);
    });

    client.on('error', (error) => {
      this.emit('error', { client, error });
    });
  }

  /**
   * Handle incoming message from client
   * @private
   */
  handleMessage(message, client) {
    const { type, name, args, subscriptionId } = message;

    switch (type) {
      case 'subscribe':
        try {
          const id = this.subscribe(name, args || {}, client);
          this.sendToClient(client, {
            type: 'subscribed',
            subscriptionId: id,
          });
        } catch (error) {
          this.sendToClient(client, {
            type: 'error',
            message: error.message,
          });
        }
        break;

      case 'unsubscribe':
        this.unsubscribe(subscriptionId);
        this.sendToClient(client, {
          type: 'unsubscribed',
          subscriptionId,
        });
        break;

      default:
        this.emit('message', { type, client });
    }
  }

  /**
   * Handle client disconnect
   * @private
   */
  handleDisconnect(client) {
    this.wsClients.delete(client);

    // Clean up subscriptions for this client
    for (const [subId, sub] of this.subscribers) {
      if (sub.client === client) {
        this.unsubscribe(subId);
      }
    }

    this.emit('disconnect', { client });
  }

  /**
   * Setup periodic heartbeat
   * @private
   */
  setupHeartbeat() {
    this.heartbeat = setInterval(() => {
      for (const client of this.wsClients) {
        if (client && client.readyState === 1) {
          this.sendToClient(client, { type: 'ping' });
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Generate unique subscription ID
   * @private
   */
  generateId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get subscription stats
   */
  getStats() {
    return {
      activeSubscriptions: this.subscribers.size,
      connectedClients: this.wsClients.size,
      registeredSubscriptions: this.subscriptions.size,
      totalMessages: Array.from(this.subscribers.values()).reduce(
        (sum, sub) => sum + sub.messageCount,
        0
      ),
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.subscribers.clear();
    this.wsClients.clear();
    this.subscriptions.clear();
  }
}

module.exports = GraphQLSubscriptions;
