/**
 * Database Configuration
 * Connection pooling and optimization settings
 */

const mongoose = require('mongoose');

class DatabaseConfig {
  constructor(options = {}) {
    this.options = {
      uri: options.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/codepark',
      poolSize: {
        min: options.minPoolSize || 10,
        max: options.maxPoolSize || 100
      },
      timeouts: {
        serverSelection: options.serverSelectionTimeout || 5000,
        socket: options.socketTimeout || 45000,
        connection: options.connectionTimeout || 30000
      },
      retryWrites: options.retryWrites !== false,
      w: options.writeConcern || 'majority',
      ...options
    };

    this.connection = null;
  }

  /**
   * Connect to database with pooling
   */
  async connect() {
    try {
      const connectionOptions = {
        // Connection Pool Settings
        minPoolSize: this.options.poolSize.min,
        maxPoolSize: this.options.poolSize.max,

        // Timeout Settings
        serverSelectionTimeoutMS: this.options.timeouts.serverSelection,
        socketTimeoutMS: this.options.timeouts.socket,
        connectTimeoutMS: this.options.timeouts.connection,

        // Reliability Settings
        retryWrites: this.options.retryWrites,
        w: this.options.w,

        // Performance Settings
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: process.env.NODE_ENV !== 'production', // Disable in production
        
        // Monitoring
        family: 4 // Use IPv4, skip trying IPv6
      };

      this.connection = await mongoose.connect(this.options.uri, connectionOptions);

      console.log('[Database] Connected successfully');
      console.log(`[Database] Pool size: ${this.options.poolSize.min}-${this.options.poolSize.max}`);

      this._setupEventListeners();

      return this.connection;
    } catch (error) {
      console.error('[Database] Connection error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('[Database] Disconnected');
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    if (!this.connection) {
      return { connected: false };
    }

    const db = mongoose.connection.db;
    const stats = mongoose.connection.readyState;

    return {
      connected: stats === 1,
      readyState: this._getReadyStateText(stats),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models).length
    };
  }

  /**
   * Create optimized indexes
   * @param {Object} schema - Mongoose schema
   * @param {Array} indexes - Index definitions
   */
  createIndexes(schema, indexes) {
    indexes.forEach(index => {
      schema.index(index.fields, index.options || {});
    });
  }

  /**
   * Setup connection event listeners
   */
  _setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('[Database] Mongoose connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database] Mongoose error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[Database] Mongoose disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] Mongoose reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Get readable ready state text
   */
  _getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state] || 'unknown';
  }
}

// Connection Pool Helper
class ConnectionPool {
  constructor(options = {}) {
    this.options = {
      min: options.min || 10,
      max: options.max || 100,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 2000,
      ...options
    };
  }

  /**
   * Get pool configuration
   */
  getConfig() {
    return this.options;
  }
}

module.exports = DatabaseConfig;
module.exports.ConnectionPool = ConnectionPool;
