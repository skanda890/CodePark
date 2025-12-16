// webhook-system/browser-security-config.js
// ✅ Security configuration for browser-safe webhook system

export const WEBHOOK_SECURITY = {
  projectName: 'webhook-system',
  riskLevel: 'MEDIUM',

  // Execution model
  executionModel: {
    clientSideSimulation: true,
    mockWebhooksEnabled: true,
    demoMode: true
  },

  // Webhook simulation
  simulation: {
    supportedEvents: ['push', 'pull_request', 'issues', 'release'],
    customPayloads: true
  },

  // Storage
  storage: {
    dbName: 'WebhooksDB',
    storeName: 'events',
    retentionDays: 30
  },

  // Event validation
  validation: {
    validatePayload: true,
    forbiddenPatterns: [/password|token|secret/gi, /api_key|apikey/gi]
  },

  // Rate limiting
  rateLimit: {
    maxEventsPerMinute: 100,
    maxPayloadSize: 1000000
  },

  // Audit trail
  auditTrail: {
    enabled: true,
    logAllEvents: true
  }
}

export default WEBHOOK_SECURITY
