/**
 * Distributed Tracing System (Feature #14)
 * Implements OpenTelemetry-compatible tracing
 */

const crypto = require('crypto');

class DistributedTracer {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'codepark';
    this.samplingRate = options.samplingRate || 1.0; // 100% sampling
    this.traces = new Map();
    this.maxTraceSize = options.maxTraceSize || 1000;
  }

  /**
   * Create span
   */
  createSpan(operationName, parentSpanId = null) {
    const spanId = crypto.randomBytes(8).toString('hex');
    const traceId = parentSpanId ? this.getTraceId(parentSpanId) : crypto.randomBytes(16).toString('hex');

    const span = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      tags: {},
      logs: [],
      status: 'running',
    };

    this.traces.set(spanId, span);
    return span;
  }

  /**
   * End span
   */
  endSpan(spanId, status = 'ok') {
    const span = this.traces.get(spanId);
    if (!span) {
      return null;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    return span;
  }

  /**
   * Add tag to span
   */
  addTag(spanId, key, value) {
    const span = this.traces.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  /**
   * Add log to span
   */
  addLog(spanId, message, fields = {}) {
    const span = this.traces.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        fields,
      });
    }
  }

  /**
   * Get trace
   */
  getTrace(traceId) {
    const spans = Array.from(this.traces.values()).filter(
      (span) => span.traceId === traceId
    );
    return { traceId, spans };
  }

  /**
   * Get trace ID from span ID
   */
  getTraceId(spanId) {
    const span = this.traces.get(spanId);
    return span ? span.traceId : null;
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const span = this.createSpan(`${req.method} ${req.path}`);
      this.addTag(span.spanId, 'http.method', req.method);
      this.addTag(span.spanId, 'http.url', req.url);
      this.addTag(span.spanId, 'http.client_ip', req.ip);

      // Store span in request
      req.span = span;

      // End span on response
      res.on('finish', () => {
        this.addTag(span.spanId, 'http.status_code', res.statusCode);
        this.endSpan(span.spanId);
      });

      next();
    };
  }
}

module.exports = DistributedTracer;
