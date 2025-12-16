// bios-info/browser-security-config.js
// ✅ Security configuration for browser-safe system info

export const BIOS_INFO_SECURITY = {
  projectName: 'bios-info',
  riskLevel: 'MEDIUM',
  
  // Available APIs (read-only)
  allowedAPIs: [
    'navigator.deviceMemory',
    'navigator.hardwareConcurrency',
    'navigator.maxTouchPoints',
    'navigator.language',
    'navigator.userAgent',
    'navigator.vendor',
    'screen.width',
    'screen.height',
    'screen.colorDepth',
  ],

  // Data collection
  dataCollection: {
    requiresPermission: false,
    anonymized: true,
    retention: 3600000, // 1 hour
  },

  // Demo/Mock data
  demoMode: {
    enabled: true,
    mockData: {
      deviceMemory: 8,
      hardwareConcurrency: 8,
      osName: 'Linux',
      osVersion: '5.10',
    }
  },

  // Restrictions
  restrictions: {
    noSensitiveData: true,
    noIdentifyingInfo: true,
    noLocationData: true,
  }
};

export default BIOS_INFO_SECURITY;
