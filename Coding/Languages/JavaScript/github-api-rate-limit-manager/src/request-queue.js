/**
 * Smart Request Queuing System for GitHub API Rate Limit Manager
 * 
 * Features:
 * - Priority-based request queuing (4 levels: critical, high, normal, low)
 * - Automatic rate limit detection
 * - Exponential backoff retry (up to 3 attempts)
 * - Concurrent request management (configurable)
 * - Queue pause/resume functionality
 * - Per-token queue management
 * - Queue health monitoring
 */

class RequestQueue {
  constructor(config = {}) {
    // Priority levels
    this.PRIORITY = {
      CRITICAL: 1,
      HIGH: 2,
      NORMAL: 3,
      LOW: 4
    };

    this.queues = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };

    this.perTokenQueues = new Map();
    this.maxConcurrent = config.maxConcurrent || 5;
    this.activeRequests = 0;
    this.paused = false;
    this.maxRetries = config.maxRetries || 3;
    this.baseBackoffMs = config.baseBackoffMs || 1000;
    this.maxBackoffMs = config.maxBackoffMs || 30000;

    // Statistics
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalRetries: 0,
      totalFailed: 0,
      totalSuccess: 0,
      averageWaitTime: 0,
      peakQueueLength: 0
    };

    this.waitTimes = [];
    this.requestHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;
  }

  /**
   * Enqueue a request with priority
   */
  enqueue(request, priority = 'normal') {
    const queueEntry = {
      id: `req_${Date.now()}_${Math.random()}`,
      request,
      priority,
      enqueuedAt: new Date(),
      attempts: 0,
      tokenId: request.tokenId,
      status: 'queued'
    };

    // Add to priority queue
    const priorityLevel = this.PRIORITY[priority.toUpperCase()] || this.PRIORITY.NORMAL;
    let added = false;

    // Find correct position based on priority
    for (let i = 0; i < this.queues[priority].length; i++) {
      if (priorityLevel < this.PRIORITY[this.queues[priority][i].priority.toUpperCase()]) {
        this.queues[priority].splice(i, 0, queueEntry);
        added = true;
        break;
      }
    }

    if (!added) {
      this.queues[priority].push(queueEntry);
    }

    // Add to per-token queue if specified
    if (request.tokenId) {
      if (!this.perTokenQueues.has(request.tokenId)) {
        this.perTokenQueues.set(request.tokenId, []);
      }
      this.perTokenQueues.get(request.tokenId).push(queueEntry);
    }

    this.stats.totalQueued++;
    this.updatePeakQueueLength();

    return queueEntry;
  }

  /**
   * Dequeue and get next request to process
   */
  dequeue() {
    if (this.paused) {
      return null;
    }

    if (this.activeRequests >= this.maxConcurrent) {
      return null;
    }

    // Try each priority level in order
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      if (this.queues[priority].length > 0) {
        const entry = this.queues[priority].shift();
        entry.status = 'processing';
        entry.processingStarted = new Date();
        this.activeRequests++;
        return entry;
      }
    }

    return null;
  }

  /**
   * Process a request with automatic retry
   */
  async processRequest(entry, requestHandler) {
    try {
      const result = await this.executeWithBackoff(entry, requestHandler);
      this.markSuccess(entry, result);
      return result;
    } catch (error) {
      if (entry.attempts < this.maxRetries) {
        entry.attempts++;
        this.stats.totalRetries++;
        const backoffMs = this.calculateBackoff(entry.attempts);
        await this.delay(backoffMs);
        return this.processRequest(entry, requestHandler);
      } else {
        this.markFailed(entry, error);
        throw error;
      }
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Execute request with backoff
   */
  async executeWithBackoff(entry, handler, attempt = 0) {
    try {
      return await handler(entry.request);
    } catch (error) {
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        const backoffMs = this.calculateBackoff(attempt + 1);
        await this.delay(backoffMs);
        return this.executeWithBackoff(entry, handler, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return retryableCodes.includes(error.status) || error.code === 'ECONNRESET';
  }

  /**
   * Calculate exponential backoff
   */
  calculateBackoff(attempt) {
    const backoff = this.baseBackoffMs * Math.pow(2, attempt - 1);
    return Math.min(backoff, this.maxBackoffMs);
  }

  /**
   * Mark request as successful
   */
  markSuccess(entry, result) {
    entry.status = 'success';
    entry.completedAt = new Date();
    entry.result = result;

    const waitTime = entry.processingStarted - entry.enqueuedAt;
    this.waitTimes.push(waitTime);
    this.updateAverageWaitTime();
    this.stats.totalProcessed++;
    this.stats.totalSuccess++;

    this.recordHistory(entry);
  }

  /**
   * Mark request as failed
   */
  markFailed(entry, error) {
    entry.status = 'failed';
    entry.completedAt = new Date();
    entry.error = error.message;

    this.stats.totalProcessed++;
    this.stats.totalFailed++;

    this.recordHistory(entry);
  }

  /**
   * Update average wait time
   */
  updateAverageWaitTime() {
    if (this.waitTimes.length === 0) return;
    const sum = this.waitTimes.reduce((a, b) => a + b, 0);
    this.stats.averageWaitTime = Math.round(sum / this.waitTimes.length);
  }

  /**
   * Update peak queue length
   */
  updatePeakQueueLength() {
    const currentLength = this.getTotalQueueLength();
    if (currentLength > this.stats.peakQueueLength) {
      this.stats.peakQueueLength = currentLength;
    }
  }

  /**
   * Record request in history
   */
  recordHistory(entry) {
    this.requestHistory.push({
      id: entry.id,
      priority: entry.priority,
      status: entry.status,
      attempts: entry.attempts,
      enqueuedAt: entry.enqueuedAt,
      completedAt: entry.completedAt,
      duration: entry.completedAt - entry.enqueuedAt
    });

    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.paused = true;
    return { paused: true, activeRequests: this.activeRequests };
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.paused = false;
    return { paused: false, activeRequests: this.activeRequests };
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      paused: this.paused,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      queueLengths: {
        critical: this.queues.critical.length,
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        total: this.getTotalQueueLength()
      },
      stats: this.stats,
      health: this.getQueueHealth()
    };
  }

  /**
   * Get per-token queue status
   */
  getTokenQueueStatus(tokenId) {
    const queue = this.perTokenQueues.get(tokenId) || [];
    const queued = queue.filter(r => r.status === 'queued').length;
    const processing = queue.filter(r => r.status === 'processing').length;
    const completed = queue.filter(r => r.status === 'success' || r.status === 'failed').length;

    return {
      tokenId,
      queued,
      processing,
      completed,
      total: queue.length
    };
  }

  /**
   * Get queue health
   */
  getQueueHealth() {
    const totalQueued = this.stats.totalQueued;
    const successRate = totalQueued > 0 ? (this.stats.totalSuccess / totalQueued) * 100 : 0;

    let status = 'healthy';
    if (successRate < 90) status = 'warning';
    if (successRate < 70) status = 'critical';

    return {
      successRate: successRate.toFixed(2) + '%',
      status,
      activeRequests: this.activeRequests,
      queueDepth: this.getTotalQueueLength(),
      avgWaitTime: this.stats.averageWaitTime + 'ms'
    };
  }

  /**
   * Get total queue length
   */
  getTotalQueueLength() {
    return Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);
  }

  /**
   * Get request history
   */
  getHistory(limit = 50) {
    return this.requestHistory.slice(-limit).reverse();
  }

  /**
   * Clear queue
   */
  clear() {
    const clearedCount = this.getTotalQueueLength();
    Object.keys(this.queues).forEach(priority => {
      this.queues[priority] = [];
    });
    this.perTokenQueues.clear();
    return { cleared: true, count: clearedCount };
  }

  /**
   * Retry failed requests
   */
  retryFailed(priority = 'high') {
    const failedRequests = this.requestHistory.filter(r => r.status === 'failed');
    const retried = [];

    failedRequests.forEach(req => {
      // Re-queue with higher priority
      const newEntry = this.enqueue(req, priority);
      retried.push(newEntry.id);
    });

    return { retried: retried.length, ids: retried };
  }

  /**
   * Get queue metrics
   */
  getMetrics() {
    return {
      timestamp: new Date(),
      stats: this.stats,
      currentQueueLength: this.getTotalQueueLength(),
      activeRequests: this.activeRequests,
      paused: this.paused,
      health: this.getQueueHealth(),
      priorityDistribution: {
        critical: this.queues.critical.length,
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length
      }
    };
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RequestQueue;
