class AlertRulesEngine {
  constructor() {
    this.rules = new Map();
    this.alerts = [];
  }

  createRule(name, condition, actions) {
    const rule = {
      id: Math.random().toString(36).substring(7),
      name,
      condition,
      actions,
      enabled: true,
      createdAt: new Date()
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  async evaluateMetric(metricName, value) {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        if (this.evaluateCondition(rule.condition, metricName, value)) {
          await this.executeActions(rule.actions, metricName, value);
          this.recordAlert(rule.id, metricName, value);
        }
      } catch (error) {
        console.error(`Rule evaluation failed: ${error.message}`);
      }
    }
  }

  evaluateCondition(condition, metricName, value) {
    // Mock implementation
    if (condition.includes('>')) {
      const [field, threshold] = condition.split('>');
      return value > parseFloat(threshold);
    }
    return false;
  }

  async executeActions(actions, metricName, value) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'webhook':
            await this.sendWebhook(action.url, { metricName, value });
            break;
          case 'email':
            await this.sendEmail(action.recipients, { metricName, value });
            break;
          case 'slack':
            await this.sendSlack(action.channel, { metricName, value });
            break;
        }
      } catch (error) {
        console.error(`Action execution failed: ${error.message}`);
      }
    }
  }

  async sendWebhook(url, data) {
    console.log(`Sending webhook to ${url}`);
  }

  async sendEmail(recipients, data) {
    console.log(`Sending email to ${recipients.join(', ')}`);
  }

  async sendSlack(channel, data) {
    console.log(`Sending Slack message to ${channel}`);
  }

  recordAlert(ruleId, metricName, value) {
    this.alerts.push({
      ruleId,
      metricName,
      value,
      timestamp: new Date()
    });
  }
}

module.exports = AlertRulesEngine;
