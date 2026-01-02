/**
 * Enhanced Authentication Middleware with RBAC
 * Production-ready authentication and authorization
 * Phase 2 Security Implementation
 */

const jwt = require('jsonwebtoken')
const crypto = require('crypto')

class EnhancedAuthMiddleware {
  constructor (config = {}) {
    this.jwtSecret = config.jwtSecret || process.env.JWT_SECRET
    this.jwtRefreshSecret =
      config.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET
    this.tokenBlacklist = new Set()
    this.roles = new Map()
    this.initializeRoles()
  }

  initializeRoles () {
    this.roles.set('admin', {
      permissions: [
        'system:read',
        'system:write',
        'config:read',
        'config:write',
        'audit:read',
        'users:manage',
        'roles:manage'
      ],
      level: 100
    })

    this.roles.set('developer', {
      permissions: [
        'system:read',
        'config:read',
        'projects:create',
        'projects:write:own',
        'projects:read'
      ],
      level: 50
    })

    this.roles.set('user', {
      permissions: ['projects:read', 'projects:write:own'],
      level: 10
    })
  }

  /**
   * Middleware to verify JWT token
   */
  verifyToken () {
    return (req, res, next) => {
      try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
          return res.status(401).json({
            error: 'Missing authorization header',
            code: 'AUTH_MISSING'
          })
        }

        const [scheme, token] = authHeader.split(' ')

        if (scheme !== 'Bearer' || !token) {
          return res.status(401).json({
            error: 'Invalid authorization format',
            code: 'AUTH_INVALID_FORMAT'
          })
        }

        // Check blacklist
        if (this.tokenBlacklist.has(token)) {
          return res.status(401).json({
            error: 'Token revoked',
            code: 'AUTH_REVOKED'
          })
        }

        // Verify signature
        const decoded = jwt.verify(token, this.jwtSecret, {
          algorithms: ['HS256', 'HS512'],
          issuer: 'codepark',
          audience: 'codepark-api'
        })

        req.user = decoded
        req.token = token
        next()
      } catch (error) {
        const statusCode = error.name === 'TokenExpiredError' ? 401 : 401
        const code =
          error.name === 'TokenExpiredError' ? 'AUTH_EXPIRED' : 'AUTH_INVALID'

        return res.status(statusCode).json({
          error: error.message || 'Authentication failed',
          code
        })
      }
    }
  }

  /**
   * Middleware to enforce role-based access
   */
  requireRole (...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        })
      }

      const userRole = req.user.role || 'user'

      if (!allowedRoles.includes(userRole)) {
        global.logger?.warn('RBAC_VIOLATION', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          path: req.path,
          ip: req.ip
        })

        return res.status(403).json({
          error: 'Insufficient role privileges',
          code: 'RBAC_INSUFFICIENT'
        })
      }

      next()
    }
  }

  /**
   * Middleware to enforce permissions
   */
  requirePermission (...requiredPermissions) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        })
      }

      const userRole = req.user.role || 'user'
      const roleInfo = this.roles.get(userRole)
      const userPermissions = roleInfo?.permissions || []

      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      )

      if (!hasPermission) {
        global.logger?.warn('PERMISSION_DENIED', {
          userId: req.user.id,
          userRole,
          requiredPermissions,
          path: req.path
        })

        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERM_DENIED'
        })
      }

      next()
    }
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens (user) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: this.roles.get(user.role)?.permissions || []
      },
      this.jwtSecret,
      {
        expiresIn: '15m',
        algorithm: 'HS256',
        issuer: 'codepark',
        audience: 'codepark-api'
      }
    )

    const refreshToken = jwt.sign(
      {
        id: user.id,
        type: 'refresh'
      },
      this.jwtRefreshSecret,
      {
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    )

    return { accessToken, refreshToken }
  }

  /**
   * Revoke a token (add to blacklist)
   */
  revokeToken (token) {
    this.tokenBlacklist.add(token)
  }

  /**
   * Verify refresh token and generate new access token
   */
  refreshAccessToken (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        algorithms: ['HS256']
      })

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      return jwt.sign(
        {
          id: decoded.id,
          role: decoded.role
        },
        this.jwtSecret,
        {
          expiresIn: '15m',
          algorithm: 'HS256'
        }
      )
    } catch (error) {
      throw new Error('Token refresh failed: ' + error.message)
    }
  }

  /**
   * Get RBAC role permissions
   */
  getRolePermissions (role) {
    return this.roles.get(role)?.permissions || []
  }

  /**
   * Check if user has specific permission
   */
  hasPermission (userRole, permission) {
    const permissions = this.getRolePermissions(userRole)
    return permissions.includes(permission)
  }
}

module.exports = EnhancedAuthMiddleware
