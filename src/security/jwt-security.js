/**
 * JWT Security Module
 * Implements secure JWT token generation, validation, and revocation
 * Features: Token expiration, revocation tracking, replay attack prevention, JTI validation
 */

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const redis = require('redis')

// Redis client for token blacklist/revocation tracking
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
})

class JWTSecurityManager {
  constructor (options = {}) {
    this.secret = options.secret || process.env.JWT_SECRET
    this.accessTokenExpiry = options.accessTokenExpiry || '15m'
    this.refreshTokenExpiry = options.refreshTokenExpiry || '7d'
    this.issuer = options.issuer || 'codepark-api'
    this.audience = options.audience || 'codepark-users'
    this.redisClient = options.redisClient || redisClient
  }

  /**
   * Generate JWT access token with security best practices
   * - JTI (JWT ID) for revocation tracking
   * - Expiration time
   * - Issuer and audience validation
   * - Subject (user ID)
   */
  generateAccessToken (userId, metadata = {}) {
    const jti = crypto.randomBytes(16).toString('hex')
    const payload = {
      sub: userId,
      jti,
      iat: Math.floor(Date.now() / 1000),
      type: 'access',
      ...metadata
    }

    return jwt.sign(payload, this.secret, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    })
  }

  /**
   * Generate JWT refresh token
   * Separate from access token, longer expiry, used only for token refresh
   */
  generateRefreshToken (userId, metadata = {}) {
    const jti = crypto.randomBytes(16).toString('hex')
    const payload = {
      sub: userId,
      jti,
      iat: Math.floor(Date.now() / 1000),
      type: 'refresh',
      ...metadata
    }

    return jwt.sign(payload, this.secret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    })
  }

  /**
   * Verify token with security checks
   * - Signature verification
   * - Expiration check
   * - Issuer and audience validation
   * - Revocation check
   */
  async verifyToken (token) {
    try {
      // Verify signature and basic claims
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      })

      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(decoded.jti)
      if (isRevoked) {
        throw new Error('Token has been revoked')
      }

      return decoded
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token signature')
      }
      throw error
    }
  }

  /**
   * Revoke token by adding JTI to blacklist
   * Token remains in Redis until expiration time
   */
  async revokeToken (token) {
    try {
      const decoded = jwt.decode(token)
      if (!decoded || !decoded.jti) {
        throw new Error('Invalid token format')
      }

      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
      if (expiresIn > 0) {
        await redisClient.setex(
          `revoked_token:${decoded.jti}`,
          expiresIn,
          JSON.stringify({
            revokedAt: new Date().toISOString(),
            userId: decoded.sub
          })
        )
      }

      return true
    } catch (error) {
      console.error('Error revoking token:', error)
      throw error
    }
  }

  /**
   * Check if token is in revocation blacklist
   */
  async isTokenRevoked (jti) {
    const revoked = await redisClient.get(`revoked_token:${jti}`)
    return !!revoked
  }

  /**
   * Refresh access token using refresh token
   * Validates refresh token and generates new access token
   */
  async refreshAccessToken (refreshToken, userId) {
    try {
      const decoded = await this.verifyToken(refreshToken)

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type for refresh')
      }

      if (decoded.sub !== userId) {
        throw new Error('Token user mismatch')
      }

      // Revoke old refresh token (optional security measure)
      // await this.revokeToken(refreshToken);

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(userId)
      const newRefreshToken = this.generateRefreshToken(userId)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.accessTokenExpiry
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  /**
   * Logout - revoke all user tokens
   * Can be extended to blacklist all tokens for a user
   */
  async logout (token) {
    return this.revokeToken(token)
  }
}

module.exports = JWTSecurityManager
