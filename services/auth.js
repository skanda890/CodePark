/**
 * Authentication Service - Fixed Version
 * Implements secure authentication with JWT and Argon2
 */

const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const logger = require('./logger');

class AuthService {
  constructor() {
    try {
      this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      this.jwtExpiry = process.env.JWT_EXPIRY || '1h';
      this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
      this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

      if (!this.jwtSecret || this.jwtSecret === 'your-secret-key-change-in-production') {
        logger.warn('Using default JWT_SECRET - change in production!');
      }
    } catch (error) {
      logger.error('AuthService initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Hash password using Argon2
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1
      });

      return hash;
    } catch (error) {
      logger.error('Password hashing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || typeof password !== 'string') {
        logger.warn('Invalid password provided for verification');
        return false;
      }

      if (!hash || typeof hash !== 'string') {
        logger.warn('Invalid hash provided for verification');
        return false;
      }

      const isValid = await argon2.verify(hash, password);
      return isValid;
    } catch (error) {
      logger.error('Password verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Generate access token
   */
  generateToken(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload must be a non-empty object');
      }

      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiry,
        algorithm: 'HS256'
      });

      return token;
    } catch (error) {
      logger.error('Token generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload must be a non-empty object');
      }

      const token = jwt.sign(payload, this.refreshSecret, {
        expiresIn: this.refreshExpiry,
        algorithm: 'HS256'
      });

      return token;
    } catch (error) {
      logger.error('Refresh token generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify access token
   */
  verifyToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        logger.warn('Invalid token provided for verification');
        return null;
      }

      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256']
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Token expired', { expiresAt: error.expiredAt });
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid token', { error: error.message });
      } else {
        logger.error('Token verification failed', { error: error.message });
      }
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        logger.warn('Invalid refresh token provided');
        return null;
      }

      const decoded = jwt.verify(token, this.refreshSecret, {
        algorithms: ['HS256']
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Refresh token expired', { expiresAt: error.expiredAt });
      } else {
        logger.warn('Refresh token verification failed', { error: error.message });
      }
      return null;
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      logger.error('Token decoding failed', { error: error.message });
      return null;
    }
  }

  /**
   * Refresh token pair
   */
  refreshTokens(refreshToken) {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new Error('Invalid refresh token');
      }

      // Remove exp and iat claims
      const { exp, iat, ...cleanPayload } = payload;

      return {
        accessToken: this.generateToken(cleanPayload),
        refreshToken: this.generateRefreshToken(cleanPayload)
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();
