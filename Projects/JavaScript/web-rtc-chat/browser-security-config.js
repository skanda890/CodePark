// web-rtc-chat/browser-security-config.js
// ✅ Security configuration for browser-safe WebRTC chat

export const WEBRTC_SECURITY = {
  projectName: 'web-rtc-chat',
  riskLevel: 'HIGH',
  
  // HTTPS enforcement
  https: {
    enforced: true,
    upgradeInsecure: true,
  },

  // Media permissions
  media: {
    audio: true,
    video: true,
    screen: false,
    requiresUserPermission: true,
  },

  // TURN servers (for NAT traversal)
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],

  // Signaling security
  signaling: {
    protocol: 'WSS', // Secure WebSocket
    dtlsRequired: true,
    checksumValidation: true,
  },

  // Encryption
  encryption: {
    enabled: true,
    srtp: true,
    dtls: true,
  },

  // CSP for WebRTC
  csp: {
    connectSrc: ['wss://', 'https://'],
    mediaSrc: ["'self'"],
  }
};

export default WEBRTC_SECURITY;
