// ci-cd-pipeline/browser-security-config.js
// ✅ Security configuration for browser-safe CI/CD

export const CI_CD_SECURITY = {
  projectName: 'ci-cd-pipeline',
  riskLevel: 'CRITICAL',
  
  // Execution model (definition only)
  executionModel: {
    definitionOnly: true,
    executedOnBackend: true,
    noClientSideExecution: true,
  },

  // Workflow schema
  workflow: {
    supportedTriggers: ['push', 'pull_request', 'schedule'],
    supportedSteps: ['build', 'test', 'deploy'],
    validationStrict: true,
  },

  // Validation
  validation: {
    forbiddenCommands: [
      'rm -rf',
      'shutdown',
      'reboot',
      'sudo',
    ],
    forbiddenPatterns: [
      /password|token|secret/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
    ]
  },

  // Workflow signing
  signing: {
    enabled: true,
    algorithm: 'HMAC-SHA256',
  },

  // Audit trail
  auditTrail: {
    enabled: true,
    logAllWorkflows: true,
  }
};

export default CI_CD_SECURITY;
