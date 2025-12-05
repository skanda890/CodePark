/**
 * JWT Authentication Service
 * Handles token generation and verification
 */

const jwt = require('jsonwebtoken')
const config = require('../config')
const logger = require('../config/logger')

class AuthService {
  /**
   * Generate access token
   * @param {Object} payload - User data to encode
   * @returns {string} JWT token
   */
  generateAccessToken (payload) {
    try {
      return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiry
      })
    } catch (error) {
      logger.error({ err: error }, 'Error generating access token')
      throw error
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - User data to encode
   * @returns {string} JWT refresh token
   */
  generateRefreshToken (payload) {
    try {
      const secret = config.jwtRefreshSecret || config.jwtSecret;
      return jwt.sign(payload, secret, {
        expiresIn: config.jwtRefreshExpiry
      })
    } catch (error) {
      logger.error({ err: error }, 'Error generating refresh token')
      throw error
    }
  }

  /**
   * Verify token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded payload
   */
  verifyToken (token) {
    try {
      return jwt.verify(token, config.jwtSecret)
    } catch (error) {
      logger.warn({ err: error }, 'Token verification failed')
      throw error
    }
  }

  /**
   * Decode token without verification
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded payload
   */
  decodeToken (token) {
    return jwt.decode(token)
  }
}

module.exports = new AuthService()
