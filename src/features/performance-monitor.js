/**
 * Performance Monitoring System (Feature #38)
 * Tracks application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  /**
   * Start timer
   */
  startTimer(label) {
    this.timers.set(label, Date.now());
  }

  /**
   * End timer and record metric
   */
  endTimer(label) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      return null;
    }

    const duration = Date.now() - startTime;
    this.recordMetric(label, duration);
    this.timers.delete(label);

    return duration;
  }

  /**
   * Record metric
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const nums = values.map((m) => m.value);
    nums.sort((a, b) => a - b);

    return {
      count: nums.length,
      min: nums[0],
      max: nums[nums.length - 1],
      avg: nums.reduce((a, b) => a + b) / nums.length,
      median: nums[Math.floor(nums.length / 2)],
      p95: nums[Math.floor(nums.length * 0.95)],
      p99: nums[Math.floor(nums.length * 0.99)],
    };
  }
}

module.exports = PerformanceMonitor;