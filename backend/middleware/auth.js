const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT Token from cookies or Authorization header
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user and token to request
    req.userId = decoded.userId;
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

/**
 * Verify refresh token and issue new access token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Get user and verify refresh token is valid
    const user = await User.findById(decoded.userId);
    if (!user || !user.verifyRefreshToken(refreshToken)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const { accessToken } = user.generateTokens();

    // Set HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

/**
 * Socket.IO authentication middleware
 */
const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach userId to socket
    socket.userId = decoded.userId;
    socket.token = token;

    next();
  } catch (error) {
    next(new Error('Invalid token: ' + error.message));
  }
};

/**
 * Check if user is admin
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

/**
 * Check if user is premium
 */
const isPremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user?.isPremium || user.premiumExpires < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Premium membership required',
        code: 'PREMIUM_REQUIRED'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Premium check failed'
    });
  }
};

/**
 * Rate limiting middleware
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.userId || req.ip;
    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

/**
 * Input validation middleware
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * CORS middleware for Socket.IO
 */
const socketCORS = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  verifyToken,
  refreshAccessToken,
  socketAuthMiddleware,
  isAdmin,
  isPremium,
  rateLimit,
  validateInput,
  socketCORS
};
