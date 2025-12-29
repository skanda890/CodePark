/**
 * Request Correlation Tracker (Feature #24)
 * Tracks request flow across services
 */

const crypto = require('crypto');

class CorrelationTracker {
  constructor() {
    this.correlations = new Map();
    this.traces = new Map();
  }

  /**
   * Start correlation
   */
  startCorrelation(userId = null, metadata = {}) {
    const correlationId = crypto.randomUUID();
    const correlation = {
      correlationId,
      userId,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      steps: [],
      metadata,
    };

    this.correlations.set(correlationId, correlation);
    return correlationId;
  }

  /**
   * Add step to correlation
   */
  addStep(correlationId, stepName, result, duration) {
    const correlation = this.correlations.get(correlationId);
    if (correlation) {
      correlation.steps.push({
        name: stepName,
        result,
        duration,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * End correlation
   */
  endCorrelation(correlationId) {
    const correlation = this.correlations.get(correlationId);
    if (correlation) {
      correlation.endTime = Date.now();
      correlation.duration = correlation.endTime - correlation.startTime;
    }
    return correlation;
  }

  /**
   * Get correlation trace
   */
  getTrace(correlationId) {
    return this.correlations.get(correlationId);
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const correlationId = req.get('x-correlation-id') || this.startCorrelation(req.user?.id);
      req.correlationId = correlationId;
      res.set('X-Correlation-ID', correlationId);
      next();
    };
  }
}

module.exports = CorrelationTracker;