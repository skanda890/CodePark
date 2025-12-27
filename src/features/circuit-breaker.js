/**
 * Circuit Breaker Pattern (Feature #26)
 * Prevents cascading failures in microservices
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  /**
   * Execute function with circuit breaker
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to transition to HALF_OPEN
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.successCount += 1;
        if (this.successCount >= this.successThreshold) {
          this.state = 'CLOSED';
          this.failureCount = 0;
          this.successCount = 0;
        }
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount += 1;

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.timeout;
      }

      throw error;
    }
  }

  /**
   * Get circuit state
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

module.exports = CircuitBreaker;
