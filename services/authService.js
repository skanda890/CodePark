/**
 * Authentication Service - Refactored & Simplified
 * Centralized config, consistent error handling, minimal complexity
 */

const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const authConfig = require('../config/authConfig');
const logger = require('./logger');

class AuthService {
  constructor() {
    this.jwtSecret = authConfig.jwtSecret;
    this.jwtExpiry = authConfig.jwtExpiry;
    this.refreshSecret = authConfig.refreshSecret;
    this.refreshExpiry = authConfig.refreshExpiry;
  }

  /**
   * Hash password using Argon2
   */
  async hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1
    });
  }

  /**
   * Verify password against hash
   * Returns false on any verification failure (safe comparison)
   */
  async verifyPassword(password, hash) {
    if (!password || typeof password !== 'string') return false;
    if (!hash || typeof hash !== 'string') return false;

    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Generate access token
   * Throws on invalid payload
   */
  generateToken(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-empty object');
    }

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
      algorithm: 'HS256'
    });
  }

  /**
   * Generate refresh token
   * Throws on invalid payload
   */
  generateRefreshToken(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be a non-empty object');
    }

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify access token
   * Throws on invalid/expired token
   * Caller responsible for error handling
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string');
    }

    // Let jwt.verify throw naturally; no try/catch needed
    return jwt.verify(token, this.jwtSecret, {
      algorithms: ['HS256']
    });
  }

  /**
   * Verify refresh token
   * Throws on invalid/expired token
   */
  verifyRefreshToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Refresh token must be a non-empty string');
    }

    return jwt.verify(token, this.refreshSecret, {
      algorithms: ['HS256']
    });
  }

  /**
   * Decode token without verification
   * Safe operation, returns null if token invalid
   */
  decodeToken(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    return jwt.decode(token);
  }

  /**
   * Refresh token pair
   * Central error handling for token operations
   * Throws on verification failure or invalid refresh token
   */
  refreshTokens(refreshToken) {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      // Remove exp and iat claims before re-signing
      const { exp, iat, ...cleanPayload } = payload;

      return {
        accessToken: this.generateToken(cleanPayload),
        refreshToken: this.generateRefreshToken(cleanPayload),
        expiresIn: this.jwtExpiry
      };
    } catch (error) {
      // Central logging and error mapping
      if (error.name === 'TokenExpiredError') {
        logger.warn('Refresh token expired', { expiresAt: error.expiredAt });
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid refresh token', { error: error.message });
      } else {
        logger.error('Token refresh failed', { error: error.message });
      }

      // Rethrow with context
      throw error;
    }
  }
}

module.exports = new AuthService();
