// security-indicator-component.js
// ✅ HTTPS Security Indicator Component
// Display "Connection is secure" message like the browser lock icon

export class SecurityIndicator {
  constructor (containerId = 'security-indicator', options = {}) {
    this.containerId = containerId
    this.options = {
      showDetails: options.showDetails !== false,
      position: options.position || 'top-right',
      theme: options.theme || 'dark',
      autoHide: options.autoHide || false,
      autoHideDelay: options.autoHideDelay || 10000,
      ...options
    }
    this.securityStatus = this.detectSecurityStatus()
    this.render()
  }

  detectSecurityStatus () {
    return {
      protocol: window.location.protocol === 'https:' ? 'HTTPS' : 'HTTP',
      isSecure: window.location.protocol === 'https:',
      hostname: window.location.hostname,
      timestamp: new Date().toLocaleString()
    }
  }

  createStyles () {
    const isDark = this.options.theme === 'dark'
    const positionTop = this.options.position.includes('top')
    const positionRight = this.options.position.includes('right')

    return `
      #${this.containerId} {
        position: fixed;
        ${positionTop ? 'top' : 'bottom'}: 20px;
        ${positionRight ? 'right' : 'left'}: 20px;
        background: ${this.securityStatus.isSecure ? '#1a1a1a' : '#8b0000'};
        color: ${isDark ? '#fff' : '#000'};
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 320px;
        z-index: 9999;
        border: 1px solid ${this.securityStatus.isSecure ? '#00d084' : '#ff6b6b'};
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      #${this.containerId} .security-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: ${this.options.showDetails ? '8px' : '0'};
        font-weight: 600;
      }

      #${this.containerId} .security-icon {
        font-size: 20px;
        line-height: 1;
      }

      #${this.containerId} .security-details {
        font-size: 12px;
        opacity: 0.8;
        line-height: 1.6;
      }

      #${this.containerId} .security-status {
        padding: 4px 8px;
        background: ${this.securityStatus.isSecure ? 'rgba(0, 208, 132, 0.2)' : 'rgba(255, 107, 107, 0.2)'};
        border-radius: 4px;
        display: inline-block;
        margin-top: 8px;
        font-size: 12px;
      }

      #${this.containerId}.minimized {
        padding: 8px 12px;
        max-width: auto;
      }

      #${this.containerId}.minimized .security-details,
      #${this.containerId}.minimized .security-status {
        display: none;
      }
    `
  }

  render () {
    const container = document.getElementById(this.containerId)
    if (!container) {
      console.warn(`Container #${this.containerId} not found`)
      return
    }

    // Add styles
    const existingStyle = document.querySelector(
      'style[data-security-indicator]'
    )
    if (!existingStyle) {
      const styleEl = document.createElement('style')
      styleEl.setAttribute('data-security-indicator', 'true')
      styleEl.textContent = this.createStyles()
      document.head.appendChild(styleEl)
    }

    // Create HTML
    const icon = this.securityStatus.isSecure ? '🔒' : '⚠️'
    const title = this.securityStatus.isSecure
      ? 'Connection is secure'
      : 'Connection is not secure'
    const statusIcon = this.securityStatus.isSecure ? '✓' : '✗'
    const statusText = this.securityStatus.isSecure ? 'Secure' : 'Not Secure'

    let details = ''
    if (this.options.showDetails) {
      details = `
        <div class="security-details">
          <strong>Protocol:</strong> ${this.securityStatus.protocol}<br>
          <strong>Host:</strong> ${this.securityStatus.hostname}<br>
          <strong>Time:</strong> ${this.securityStatus.timestamp}
        </div>
      `
    }

    container.innerHTML = `
      <div class="security-header">
        <span class="security-icon">${icon}</span>
        <span>${title}</span>
      </div>
      ${details}
      <div class="security-status">
        ${statusIcon} ${statusText}
      </div>
    `

    if (this.securityStatus.isSecure) {
      container.style.opacity = '0.8'
    }

    // Auto-hide if enabled
    if (this.options.autoHide) {
      setTimeout(() => {
        container.style.opacity = '0'
        container.style.pointerEvents = 'none'
      }, this.options.autoHideDelay)
    }
  }

  static initialize (options = {}) {
    const indicator = new SecurityIndicator(
      options.containerId || 'security-indicator',
      options
    )
    return indicator
  }
}

// ============================================================================
// ✅ HTTPS ENFORCEMENT MIDDLEWARE
// ============================================================================

export class HTTPSEnforcer {
  static enforce () {
    // Redirect HTTP to HTTPS (except localhost)
    if (
      window.location.protocol === 'http:' &&
      !window.location.hostname.includes('localhost')
    ) {
      window.location.href =
        'https:' +
        window.location.href.substring(window.location.protocol.length)
    }

    // Warn about mixed content
    if (window.location.protocol === 'https:') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.nextHopProtocol === 'http') {
            console.warn('⚠️  Mixed content detected:', entry.name)
          }
        }
      })
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  static isSecure () {
    return window.location.protocol === 'https:'
  }

  static getProtocol () {
    return window.location.protocol.replace(':', '')
  }
}

// ============================================================================
// ✅ CONTENT SECURITY POLICY HELPER
// ============================================================================

export class CSPHelper {
  static getPolicy () {
    return {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'nonce-{RANDOM}'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https:'],
      'font-src': ["'self'", 'data:'],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': []
    }
  }

  static generateNonce () {
    return btoa(Math.random().toString(36).substr(2, 9))
  }

  static applyHeaders (headers = {}) {
    const policy = this.getPolicy()
    let cspString = ''
    for (const [key, values] of Object.entries(policy)) {
      if (values.length > 0) {
        cspString += `${key} ${values.join(' ')}; `
      } else {
        cspString += `${key}; `
      }
    }
    return cspString.trim()
  }

  static verifyPolicy () {
    const meta = document.querySelector(
      'meta[http-equiv="Content-Security-Policy"]'
    )
    return meta ? meta.getAttribute('content') : null
  }
}

export default {
  SecurityIndicator,
  HTTPSEnforcer,
  CSPHelper
}
