/**
 * Connection Pool Manager (Feature #35)
 * Manages database connection pooling
 */

class ConnectionPool {
  constructor(options = {}) {
    this.poolSize = options.poolSize || 10;
    this.connections = [];
    this.available = [];
    this.inUse = new Set();
    this.waitQueue = [];
  }

  /**
   * Initialize pool
   */
  async initialize(createConnection) {
    for (let i = 0; i < this.poolSize; i++) {
      const conn = await createConnection();
      this.connections.push(conn);
      this.available.push(conn);
    }
  }

  /**
   * Acquire connection
   */
  async acquire() {
    if (this.available.length > 0) {
      const conn = this.available.pop();
      this.inUse.add(conn);
      return conn;
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release connection
   */
  release(conn) {
    this.inUse.delete(conn);

    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.inUse.add(conn);
      resolve(conn);
    } else {
      this.available.push(conn);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.poolSize,
      available: this.available.length,
      inUse: this.inUse.size,
      waiting: this.waitQueue.length,
    };
  }
}

module.exports = ConnectionPool;