// code-compiler/browser-security-config.js
// ✅ Security configuration for browser-safe code compiler

export const CODE_COMPILER_SECURITY = {
  projectName: 'code-compiler',
  riskLevel: 'CRITICAL',

  // Execution method
  execution: {
    method: 'WebWorker',
    sandbox: true,
    timeout: 5000,
    memory: '32MB'
  },

  // Input validation
  validation: {
    maxCodeLength: 100000,
    forbiddenPatterns: [
      /require\s*\(/gi,
      /import\s+/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /__proto__/gi,
      /constructor/gi,
      /\$\{/g,
      /`/g,
      /fetch\s*\(/gi,
      /XMLHttpRequest/gi,
      /localStorage/gi,
      /sessionStorage/gi
    ]
  },

  // Worker configuration
  worker: {
    isolatedContext: true,
    noGlobalAccess: true,
    noDOM: true,
    noNetwork: true
  },

  // Error handling
  errorHandling: {
    captureOutput: true,
    captureErrors: true,
    sanitizeMessages: true
  },

  // Performance
  performance: {
    enableCaching: true,
    cacheTTL: 300000
  }
}

export default CODE_COMPILER_SECURITY
