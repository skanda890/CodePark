const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const {
  verifyToken,
  refreshAccessToken,
  rateLimit,
  validateInput
} = require('../middleware/auth')
const Joi = require('joi')

// Rate limiting for auth endpoints
const authRateLimit = rateLimit(5, 15 * 60 * 1000) // 5 requests per 15 minutes

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number and special character'
    })
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

const updateProfileSchema = Joi.object({
  bio: Joi.string().max(500),
  location: Joi.string(),
  website: Joi.string().uri(),
  phoneNumber: Joi.string().pattern(/^[0-9\-\+]{10,}$/),
  dateOfBirth: Joi.date().iso()
})

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimit,
  validateInput(registerSchema),
  async (req, res) => {
    try {
      const { username, email, password } = req.validatedBody

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error:
            existingUser.email === email.toLowerCase()
              ? 'Email already registered'
              : 'Username already taken'
        })
      }

      // Create new user
      const user = new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        oauthProvider: 'local'
      })

      await user.save()

      // Generate tokens
      const { accessToken, refreshToken } = user.generateTokens()
      await user.addRefreshToken(refreshToken)

      // Set HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      })

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: user.toJSON(),
        tokens: { accessToken, refreshToken }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        error: 'Registration failed: ' + error.message
      })
    }
  }
)

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authRateLimit,
  validateInput(loginSchema),
  async (req, res) => {
    try {
      const { email, password } = req.validatedBody

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        '+passwordHash'
      )

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        })
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password)

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        })
      }

      // Generate tokens
      const { accessToken, refreshToken } = user.generateTokens()
      await user.addRefreshToken(refreshToken)

      // Update last seen
      user.lastSeen = new Date()
      user.status = 'online'
      await user.save()

      // Set HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      })

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      res.json({
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        tokens: { accessToken, refreshToken }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        error: 'Login failed: ' + error.message
      })
    }
  }
)

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshAccessToken)

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    user.status = 'offline'
    user.lastSeen = new Date()
    await user.save()

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed: ' + error.message
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    res.json({
      success: true,
      user: user.toJSON()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user: ' + error.message
    })
  }
})

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  verifyToken,
  validateInput(updateProfileSchema),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.userId, req.validatedBody, {
        new: true
      })

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: user.toJSON()
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Profile update failed: ' + error.message
      })
    }
  }
)

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validate new password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      })
    }

    // Get user with password
    const user = await User.findById(req.userId).select('+passwordHash')

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    // Update password
    user.passwordHash = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Password change failed: ' + error.message
    })
  }
})

/**
 * POST /api/auth/block/:userId
 * Block a user
 */
router.post('/block/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    await user.blockUser(req.params.userId)

    res.json({
      success: true,
      message: 'User blocked successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Block failed: ' + error.message
    })
  }
})

/**
 * DELETE /api/auth/block/:userId
 * Unblock a user
 */
router.delete('/block/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    await user.unblockUser(req.params.userId)

    res.json({
      success: true,
      message: 'User unblocked successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Unblock failed: ' + error.message
    })
  }
})

module.exports = router
