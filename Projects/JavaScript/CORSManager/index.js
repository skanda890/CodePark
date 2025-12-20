/**
 * CORS Manager
 * Flexible CORS configuration with dynamic origin validation
 * @version 1.0.0
 */

class CORSManager {
  constructor(options = {}) {
    this.origins = new Set(options.origins || ['*']);
    this.methods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    this.allowedHeaders = new Set(options.allowedHeaders || [
      'Content-Type',
      'Authorization',
    ]);
    this.exposedHeaders = new Set(options.exposedHeaders || []);
    this.credentials = options.credentials || false;
    this.maxAge = options.maxAge || 86400;
    this.cache = new Map();
  }

  /**
   * Check if origin is allowed
   * @param {string} origin - Request origin
   * @returns {boolean} - Whether origin is allowed
   */
  isOriginAllowed(origin) {
    if (this.cache.has(origin)) {
      return this.cache.get(origin);
    }

    let allowed = false;

    for (const allowedOrigin of this.origins) {
      if (allowedOrigin === '*') {
        allowed = true;
        break;
      }

      if (this.isRegexOrigin(allowedOrigin)) {
        const regex = new RegExp(allowedOrigin);
        if (regex.test(origin)) {
          allowed = true;
          break;
        }
      } else if (allowedOrigin === origin) {
        allowed = true;
        break;
      }
    }

    this.cache.set(origin, allowed);
    return allowed;
  }

  /**
   * Check if method is allowed
   * @param {string} method - HTTP method
   * @returns {boolean}
   */
  isMethodAllowed(method) {
    return this.methods.includes(method);
  }

  /**
   * Check if headers are allowed
   * @param {Array} headers - Request headers
   * @returns {boolean}
   */
  areHeadersAllowed(headers) {
    if (!Array.isArray(headers)) return true;

    return headers.every((header) => this.allowedHeaders.has(header));
  }

  /**
   * Add origin to allowed list
   * @param {string} origin - Origin to add
   */
  addOrigin(origin) {
    this.origins.add(origin);
    this.cache.clear();
  }

  /**
   * Remove origin from allowed list
   * @param {string} origin - Origin to remove
   */
  removeOrigin(origin) {
    this.origins.delete(origin);
    this.cache.clear();
  }

  /**
   * Add header to allowed list
   * @param {string} header - Header to add
   */
  addAllowedHeader(header) {
    this.allowedHeaders.add(header);
  }

  /**
   * Add header to exposed list
   * @param {string} header - Header to expose
   */
  addExposedHeader(header) {
    this.exposedHeaders.add(header);
  }

  /**
   * Get CORS headers for response
   * @param {string} origin - Request origin
   * @param {string} method - Request method
   * @returns {object} - CORS headers
   */
  getCorsHeaders(origin, method) {
    const headers = {};

    if (!this.isOriginAllowed(origin)) {
      return headers;
    }

    headers['Access-Control-Allow-Origin'] = this.origins.has('*')
      ? '*'
      : origin;

    if (this.credentials && origin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.methods.length > 0) {
      headers['Access-Control-Allow-Methods'] = this.methods.join(', ');
    }

    if (this.allowedHeaders.size > 0) {
      headers['Access-Control-Allow-Headers'] = Array.from(
        this.allowedHeaders
      ).join(', ');
    }

    if (this.exposedHeaders.size > 0) {
      headers['Access-Control-Expose-Headers'] = Array.from(
        this.exposedHeaders
      ).join(', ');
    }

    if (this.maxAge > 0) {
      headers['Access-Control-Max-Age'] = this.maxAge.toString();
    }

    return headers;
  }

  /**
   * Check if origin is regex pattern
   * @private
   */
  isRegexOrigin(origin) {
    return origin.startsWith('/');
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const origin = req.headers.origin || req.headers.referer;

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        const requestMethod = req.headers['access-control-request-method'];
        const requestHeaders = req.headers['access-control-request-headers'];

        if (
          requestMethod &&
          !this.isMethodAllowed(requestMethod)
        ) {
          return res.status(403).json({
            status: 'error',
            message: 'Method not allowed',
          });
        }

        if (
          requestHeaders &&
          !this.areHeadersAllowed(requestHeaders.split(', '))
        ) {
          return res.status(403).json({
            status: 'error',
            message: 'Headers not allowed',
          });
        }
      }

      // Apply CORS headers
      const corsHeaders = this.getCorsHeaders(origin, req.method);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }
}

module.exports = CORSManager;
