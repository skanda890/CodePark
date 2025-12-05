/**
 * WebSocket Service
 * Real-time bidirectional communication
 */

const WebSocket = require('ws');
const config = require('../config');
const logger = require('../config/logger');
const authService = require('./auth');
const metricsService = require('./metrics');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  init(server) {
    if (!config.websocket.enabled) return;

    this.wss = new WebSocket.Server({
      server,
      path: config.websocket.path
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      logger.error({ err: error }, 'WebSocket server error');
    });

    // Heartbeat to detect broken connections
    this.startHeartbeat();

    logger.info(`WebSocket server initialized on ${config.websocket.path}`);
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    ws.isAlive = true;
    ws.clientId = clientId;

    // Extract token from query string or headers
    const token = this.extractToken(req);

    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        ws.userId = decoded.userId;
        ws.username = decoded.username;
      } catch (error) {
        logger.warn({ err: error }, 'WebSocket auth failed');
        ws.close(1008, 'Authentication failed');
        return;
      }
    }

    this.clients.set(clientId, ws);
    metricsService.updateWsConnections(this.clients.size);

    logger.info({ clientId, username: ws.username }, 'WebSocket client connected');

    // Send welcome message
    this.send(ws, {
      type: 'welcome',
      clientId,
      message: 'Connected to CodePark WebSocket'
    });

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Handle close
    ws.on('close', () => {
      this.clients.delete(clientId);
      metricsService.updateWsConnections(this.clients.size);
      logger.info({ clientId }, 'WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error({ err: error, clientId }, 'WebSocket client error');
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      logger.debug({ message, clientId: ws.clientId }, 'WebSocket message received');

      switch (message.type) {
        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;

        case 'subscribe':
          this.handleSubscribe(ws, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, message);
          break;

        default:
          this.send(ws, { type: 'error', message: 'Unknown message type' });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error handling WebSocket message');
      this.send(ws, { type: 'error', message: 'Invalid message format' });
    }
  }

  /**
   * Handle subscribe request
   */
  handleSubscribe(ws, message) {
    const { channel } = message;
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    ws.subscriptions.add(channel);
    this.send(ws, { type: 'subscribed', channel });
    logger.debug({ clientId: ws.clientId, channel }, 'Client subscribed');
  }

  /**
   * Handle unsubscribe request
   */
  handleUnsubscribe(ws, message) {
    const { channel } = message;
    if (ws.subscriptions) {
      ws.subscriptions.delete(channel);
    }
    this.send(ws, { type: 'unsubscribed', channel });
    logger.debug({ clientId: ws.clientId, channel }, 'Client unsubscribed');
  }

  /**
   * Send message to client
   */
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(data, channel = null) {
    for (const [clientId, ws] of this.clients.entries()) {
      if (channel && ws.subscriptions && !ws.subscriptions.has(channel)) {
        continue;
      }
      this.send(ws, data);
    }
  }

  /**
   * Broadcast to specific user
   */
  broadcastToUser(userId, data) {
    for (const [clientId, ws] of this.clients.entries()) {
      if (ws.userId === userId) {
        this.send(ws, data);
      }
    }
  }

  /**
   * Start heartbeat to detect dead connections
   */
  startHeartbeat() {
    setInterval(() => {
      for (const [clientId, ws] of this.clients.entries()) {
        if (!ws.isAlive) {
          logger.debug({ clientId }, 'Terminating dead WebSocket connection');
          ws.terminate();
          this.clients.delete(clientId);
          metricsService.updateWsConnections(this.clients.size);
          continue;
        }

        ws.isAlive = false;
        ws.ping();
      }
    }, config.websocket.heartbeatInterval);
  }

  /**
   * Extract token from request
   */
  extractToken(req) {
    // From query string: ?token=xxx
    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryToken = url.searchParams.get('token');
    if (queryToken) return queryToken;

    // From authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection count
   */
  getConnectionCount() {
    return this.clients.size;
  }

  /**
   * Close all connections
   */
  close() {
    if (this.wss) {
      for (const [clientId, ws] of this.clients.entries()) {
        ws.close(1001, 'Server shutting down');
      }
      this.clients.clear();
      this.wss.close();
      logger.info('WebSocket server closed');
    }
  }
}

module.exports = new WebSocketService();
