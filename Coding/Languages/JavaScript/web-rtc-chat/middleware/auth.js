const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect routes - JWT verification
const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized to access this route' })
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    )
    req.user = await User.findById(decoded.id)

    if (!req.user) {
      return res
        .status(404)
        .json({ success: false, message: 'No user found with this id' })
    }

    next()
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized to access this route' })
  }
}

// Check admin role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.roles[0])) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }
    next()
  }
}

// Check if user owns resource
const checkOwnership = async (req, res, next) => {
  try {
    const resource = await req.resourceModel.findById(req.params.id)

    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: 'Resource not found' })
    }

    if (
      resource.creator.toString() !== req.user._id.toString() &&
      !req.user.roles.includes('admin')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this resource'
      })
    }

    req.resource = resource
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Socket.IO authentication
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error('Authentication error'))
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    async (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'))
      }

      try {
        const user = await User.findById(decoded.id)
        if (!user) {
          return next(new Error('User not found'))
        }
        socket.userId = user._id
        socket.user = user
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    }
  )
}

module.exports = {
  protect,
  authorize,
  checkOwnership,
  socketAuth
}
