// ai-code-review-assistant/browser-security-config.js
// ✅ Security configuration for browser-safe AI code review

export const AI_CODE_REVIEW_SECURITY = {
  projectName: 'ai-code-review-assistant',
  riskLevel: 'CRITICAL',

  // API proxy configuration
  apiProxy: {
    enabled: true,
    endpoint: '/api/ai/code-review',
    backendHandlesAuth: true
  },

  // Rate limiting (aggressive for AI APIs)
  rateLimit: {
    maxRequestsPerMinute: 5,
    maxRequestsPerHour: 50,
    windowMs: 60000
  },

  // Code validation before sending
  codeValidation: {
    maxCodeLength: 50000,
    forbiddenPatterns: [
      /password|token|secret|key/gi,
      /api_key|apikey|api-key/gi,
      /mongodb_uri|database_url|db_url/gi
    ]
  },

  // Request validation
  requestValidation: {
    maxRequestSize: 1000000, // 1MB
    timeout: 30000,
    retries: 2
  },

  // Result caching
  caching: {
    enabled: true,
    ttl: 3600000, // 1 hour
    maxCacheSize: 100
  },

  // Security headers
  headers: {
    'X-Code-Review-Protected': 'true',
    'X-Content-Type-Options': 'nosniff'
  }
}

export const validateCode = (code) => {
  if (code.length > AI_CODE_REVIEW_SECURITY.codeValidation.maxCodeLength) {
    throw new Error('Code exceeds maximum length')
  }
  for (const pattern of AI_CODE_REVIEW_SECURITY.codeValidation
    .forbiddenPatterns) {
    if (pattern.test(code)) {
      throw new Error('Code contains potential secrets')
    }
  }
  return true
}

export default AI_CODE_REVIEW_SECURITY
