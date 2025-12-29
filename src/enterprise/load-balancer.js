/**
 * Load Balancer (Feature #47)
 * Distributes requests across multiple servers
 */

class LoadBalancer {
  constructor(options = {}) {
    this.servers = [];
    this.currentIndex = 0;
    this.algorithm = options.algorithm || 'round-robin';
    this.healthChecks = new Map();
  }

  /**
   * Register server
   */
  registerServer(server) {
    this.servers.push({
      ...server,
      healthy: true,
      requestCount: 0,
      totalTime: 0,
    });
  }

  /**
   * Round robin
   */
  roundRobin() {
    if (this.servers.length === 0) {
      throw new Error('No servers available');
    }

    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;

    return server;
  }

  /**
   * Least connections
   */
  leastConnections() {
    const healthyServers = this.servers.filter((s) => s.healthy);
    if (healthyServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    return healthyServers.reduce((prev, current) => 
      current.requestCount < prev.requestCount ? current : prev
    );
  }

  /**
   * Get next server
   */
  getNextServer() {
    if (this.algorithm === 'round-robin') {
      return this.roundRobin();
    } else if (this.algorithm === 'least-connections') {
      return this.leastConnections();
    }
    return this.roundRobin();
  }

  /**
   * Record request
   */
  recordRequest(server, duration) {
    server.requestCount += 1;
    server.totalTime += duration;
  }

  /**
   * Check server health
   */
  checkServerHealth(server) {
    // Simulate health check
    server.healthy = Math.random() > 0.1; // 90% healthy
  }

  /**
   * Get stats
   */
  getStats() {
    return this.servers.map((s) => ({
      id: s.id,
      healthy: s.healthy,
      requestCount: s.requestCount,
      avgResponseTime: s.requestCount > 0 ? s.totalTime / s.requestCount : 0,
    }));
  }
}

module.exports = LoadBalancer;