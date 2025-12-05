/**
 * Authentication Routes
 * JWT token generation
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const logger = require('../config/logger');

/**
 * POST /api/v1/auth/token
 * Generate JWT token
 */
router.post('/token', (req, res) => {
  try {
    const { username, userId } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Username required',
        requestId: req.id
      });
    }

    const payload = {
      username,
      userId: userId || `user-${Date.now()}`,
      createdAt: Date.now()
    };

    const accessToken = authService.generateAccessToken(payload);
    const refreshToken = authService.generateRefreshToken(payload);

    logger.info({ username, requestId: req.id }, 'Token generated');

    res.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '24h',
      user: {
        username: payload.username,
        userId: payload.userId
      }
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Token generation failed');
    res.status(500).json({
      error: 'Token generation failed',
      requestId: req.id
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        requestId: req.id
      });
    }

    // Use verifyRefreshToken instead of verifyToken
    const decoded = authService.verifyRefreshToken(refreshToken);

    const payload = {
      username: decoded.username,
      userId: decoded.userId,
      createdAt: Date.now()
    };

    const accessToken = authService.generateAccessToken(payload);

    logger.info({ username: payload.username, requestId: req.id }, 'Token refreshed');

    res.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '24h'
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Token refresh failed');
    res.status(401).json({
      error: 'Invalid refresh token',
      message: error.message,
      requestId: req.id
    });
  }
});

/**
 * GET /api/v1/auth/verify
 * Verify token validity
 */
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    res.json({
      valid: true,
      user: {
        username: decoded.username,
        userId: decoded.userId
      }
    });
  } catch (error) {
    res.json({
      valid: false,
      error: error.message
    });
  }
});

module.exports = router;
