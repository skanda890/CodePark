/**
 * Monitoring & Alerting System (Feature #49)
 * Monitors application and sends alerts
 */

const crypto = require('crypto')

class MonitoringAlertingSystem {
  constructor (options = {}) {
    this.metrics = new Map()
    this.alerts = []
    this.rules = new Map()
    this.alertChannels = new Map()
  }

  /**
   * Register alert channel
   */
  registerAlertChannel (name, handler) {
    this.alertChannels.set(name, handler)
  }

  /**
   * Record metric
   */
  recordMetric (name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    this.metrics.get(name).push({
      value,
      timestamp: Date.now(),
      tags
    })

    // Keep only last 1000 metrics
    const metricList = this.metrics.get(name)
    if (metricList.length > 1000) {
      metricList.shift()
    }

    this.checkRules(name, value)
  }

  /**
   * Define alert rule
   */
  defineRule (name, condition) {
    this.rules.set(name, {
      name,
      condition,
      triggered: false,
      triggerTime: null
    })
  }

  /**
   * Check rules
   */
  checkRules (metricName, value) {
    for (const [ruleName, rule] of this.rules) {
      if (rule.condition(metricName, value)) {
        this.triggerAlert(ruleName)
      }
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert (ruleName) {
    const rule = this.rules.get(ruleName)
    if (!rule) return

    const alert = {
      id: crypto.randomUUID(),
      rule: ruleName,
      timestamp: new Date(),
      status: 'active'
    }

    this.alerts.push(alert)

    // Send to all channels
    for (const [channelName, handler] of this.alertChannels) {
      try {
        await handler(alert)
      } catch (error) {
        console.error(`Alert channel ${channelName} failed:`, error)
      }
    }
  }

  /**
   * Get metric stats
   */
  getMetricStats (name, duration = 3600000) {
    const metrics = this.metrics.get(name) || []
    const now = Date.now()
    const recentMetrics = metrics.filter((m) => now - m.timestamp < duration)

    if (recentMetrics.length === 0) {
      return null
    }

    const values = recentMetrics.map((m) => m.value)

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b) / values.length,
      latest: values[values.length - 1]
    }
  }
}

module.exports = MonitoringAlertingSystem
