/**
 * Authentication Middleware
 * JWT token verification
 */

const authService = require('../services/auth');
const logger = require('../config/logger');

module.exports = function authMiddleware(req, res, next) {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid JWT token',
        requestId: req.id
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.warn({ err: error, requestId: req.id }, 'Authentication failed');

    return res.status(401).json({
      error: 'Invalid token',
      message: error.message,
      requestId: req.id
    });
  }
};
