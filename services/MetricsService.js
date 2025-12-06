/**
 * MetricsService - Real-time monitoring and metrics collection
 * Implements real-time monitoring dashboard functionality
 */

const EventEmitter = require('events');

class MetricsService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.collectors = new Map();
    this.metrics = new Map();
    this.streamingClients = new Set();
    this.options = {
      retentionPeriod: options.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      flushInterval: options.flushInterval || 5000, // 5 seconds
      ...options
    };
    this.flushTimer = null;
  }

  /**
   * Register a new metrics collector
   * @param {string} name - Collector name
   * @param {Object} config - Collector configuration
   */
  registerCollector(name, config = {}) {
    if (this.collectors.has(name)) {
      throw new Error(`Collector '${name}' already registered`);
    }

    const collector = {
      name,
      enabled: config.enabled !== false,
      aggregation: config.aggregation || 'avg', // avg, sum, min, max, count
      tags: config.tags || [],
      data: []
    };

    this.collectors.set(name, collector);
    this.emit('collector:registered', { name, config });
    return collector;
  }

  /**
   * Record a metric value
   * @param {string} collectorName - Name of the collector
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags
   */
  record(collectorName, value, tags = {}) {
    const collector = this.collectors.get(collectorName);
    if (!collector || !collector.enabled) {
      return;
    }

    const timestamp = Date.now();
    const metric = {
      value,
      timestamp,
      tags: { ...tags, ...collector.tags }
    };

    collector.data.push(metric);
    this.emit('metric:recorded', { collectorName, metric });

    // Clean up old data
    this._cleanup(collector);
  }

  /**
   * Start streaming metrics to connected clients
   * @param {Object} io - Socket.io instance
   */
  startStreaming(io) {
    if (!io) {
      throw new Error('Socket.io instance required for streaming');
    }

    io.on('connection', (socket) => {
      this.streamingClients.add(socket);
      console.log(`[MetricsService] Client connected: ${socket.id}`);

      // Send initial metrics snapshot
      socket.emit('metrics:snapshot', this.getSnapshot());

      socket.on('disconnect', () => {
        this.streamingClients.delete(socket);
        console.log(`[MetricsService] Client disconnected: ${socket.id}`);
      });

      socket.on('metrics:subscribe', (collectors) => {
        socket.join(collectors);
      });
    });

    // Start periodic flushing
    this.flushTimer = setInterval(() => {
      this._flush(io);
    }, this.options.flushInterval);

    this.emit('streaming:started');
  }

  /**
   * Stop streaming metrics
   */
  stopStreaming() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.streamingClients.clear();
    this.emit('streaming:stopped');
  }

  /**
   * Get current metrics snapshot
   * @returns {Object} Metrics snapshot
   */
  getSnapshot() {
    const snapshot = {};
    
    for (const [name, collector] of this.collectors) {
      snapshot[name] = {
        current: this._aggregate(collector.data, collector.aggregation),
        count: collector.data.length,
        aggregation: collector.aggregation,
        lastUpdate: collector.data.length > 0 
          ? collector.data[collector.data.length - 1].timestamp 
          : null
      };
    }

    return snapshot;
  }

  /**
   * Get historical data for a collector
   * @param {string} collectorName - Collector name
   * @param {Object} options - Query options
   * @returns {Array} Historical data
   */
  getHistory(collectorName, options = {}) {
    const collector = this.collectors.get(collectorName);
    if (!collector) {
      throw new Error(`Collector '${collectorName}' not found`);
    }

    let data = [...collector.data];

    // Filter by time range
    if (options.startTime) {
      data = data.filter(m => m.timestamp >= options.startTime);
    }
    if (options.endTime) {
      data = data.filter(m => m.timestamp <= options.endTime);
    }

    // Filter by tags
    if (options.tags) {
      data = data.filter(m => {
        return Object.entries(options.tags).every(([key, value]) => 
          m.tags[key] === value
        );
      });
    }

    return data;
  }

  /**
   * Export metrics data
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported data
   */
  export(format = 'json') {
    const data = {};
    
    for (const [name, collector] of this.collectors) {
      data[name] = collector.data;
    }

    if (format === 'csv') {
      return this._toCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all metrics data
   */
  clear() {
    for (const collector of this.collectors.values()) {
      collector.data = [];
    }
    this.emit('metrics:cleared');
  }

  /**
   * Private: Flush metrics to connected clients
   */
  _flush(io) {
    const snapshot = this.getSnapshot();
    io.emit('metrics:update', snapshot);
  }

  /**
   * Private: Clean up old metrics data
   */
  _cleanup(collector) {
    const cutoff = Date.now() - this.options.retentionPeriod;
    collector.data = collector.data.filter(m => m.timestamp > cutoff);
  }

  /**
   * Private: Aggregate metric values
   */
  _aggregate(data, method) {
    if (data.length === 0) return 0;

    const values = data.map(m => m.value);

    switch (method) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[values.length - 1];
    }
  }

  /**
   * Private: Convert data to CSV format
   */
  _toCSV(data) {
    const rows = [];
    rows.push('collector,timestamp,value,tags');

    for (const [name, metrics] of Object.entries(data)) {
      for (const metric of metrics) {
        const tags = JSON.stringify(metric.tags).replace(/,/g, ';');
        rows.push(`${name},${metric.timestamp},${metric.value},${tags}`);
      }
    }

    return rows.join('\n');
  }
}

module.exports = MetricsService;
