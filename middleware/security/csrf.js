/**
 * CSRF Protection Module
 * Validates CSRF tokens for state-changing operations
 */

/**
 * Extract CSRF token from request
 * @param {Object} req - Express request object
 * @returns {string|undefined} CSRF token
 */
const getCsrfTokenFromRequest = (req) =>
  req.headers['x-csrf-token'] || req.body?._csrf;

/**
 * CSRF Protection Middleware
 * Validates CSRF token for non-safe HTTP methods
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = getCsrfTokenFromRequest(req);
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Request forbidden',
    });
  }

  next();
};

module.exports = csrfProtection;
