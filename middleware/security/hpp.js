/**
 * HTTP Parameter Pollution (HPP) Protection Module
 * Prevents parameter pollution attacks
 */

/**
 * HTTP Parameter Pollution Protection
 * Ensures only whitelisted parameters can be arrays
 */
const hppProtection = (req, res, next) => {
  // Whitelist of parameters that can be arrays
  const whitelist = ['tags', 'categories', 'ids', 'filters'];

  // Check all query parameters
  for (const key in req.query) {
    if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
      // Take only first value if not whitelisted
      req.query[key] = req.query[key][0];
    }
  }

  // Check body parameters
  for (const key in req.body) {
    if (Array.isArray(req.body[key]) && !whitelist.includes(key)) {
      req.body[key] = req.body[key][0];
    }
  }

  next();
};

module.exports = hppProtection;
