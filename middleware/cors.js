/**
 * CORS Middleware
 * Configure Cross-Origin Resource Sharing
 */

const logger = require('../config/logger');

/**
 * Create CORS middleware with allowed origin
 * @param {string} allowedOrigin - Allowed origin (* for all)
 * @returns {Function} Express middleware
 */
module.exports = function createCorsMiddleware(allowedOrigin = '*') {
  return (req, res, next) => {
    const origin = req.headers.origin;

    // Set CORS headers
    if (allowedOrigin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      // Check if origin is allowed
      const allowedOrigins = allowedOrigin.split(',').map((o) => o.trim());
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (allowedOrigins.length === 1) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
};
