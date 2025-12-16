// mobile-companion-app/browser-security-config.js
// ✅ Security configuration for browser-safe mobile companion app

export const MOBILE_COMPANION_SECURITY = {
  projectName: 'mobile-companion-app',
  riskLevel: 'MEDIUM',
  
  // PWA configuration
  pwa: {
    enabled: true,
    offlineFirst: true,
    serviceWorkerEnabled: true,
  },

  // Storage
  storage: {
    dbName: 'MobileAppDB',
    storeName: 'appData',
    encryptionEnabled: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  },

  // Service Worker
  serviceWorker: {
    enabled: true,
    backgroundSync: true,
    pushNotifications: true,
  },

  // Sync strategy
  sync: {
    strategy: 'queue-based',
    onlineCheck: true,
    autoSync: true,
    syncInterval: 300000, // 5 minutes
  },

  // Data freshness
  dataFreshness: {
    cacheExpiration: 3600000, // 1 hour
    forceRefreshOnInterval: false,
  },

  // Responsive design
  responsive: {
    mobileFirst: true,
    touchOptimized: true,
  }
};

export default MOBILE_COMPANION_SECURITY;
