const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Authentication
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    lowercase: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    select: false
  },
  
  // OAuth
  googleId: String,
  githubId: String,
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: null
  },
  location: String,
  website: String,
  phoneNumber: String,
  dateOfBirth: Date,
  
  // Status & Presence
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'dnd'],
    default: 'offline',
    index: true
  },
  customStatus: String,
  statusExpiresAt: Date,
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastSeenFrom: String, // Platform (web, mobile, etc.)
  
  // Settings & Preferences
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    accentColor: {
      type: String,
      default: '#2180B8'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      doNotDisturb: { type: Boolean, default: false },
      dndSchedule: {
        enabled: { type: Boolean, default: false },
        start: String, // HH:mm format
        end: String
      },
      notificationTypes: {
        messages: { type: Boolean, default: true },
        calls: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true }
      }
    },
    encryption: {
      enabled: { type: Boolean, default: false },
      alwaysEncrypt: { type: Boolean, default: false }
    },
    autoAnswer: { type: Boolean, default: false },
    hdQuality: { type: Boolean, default: true }
  },
  
  // Privacy & Security
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  allowCallsFrom: {
    type: String,
    enum: ['everyone', 'friends', 'nobody'],
    default: 'everyone'
  },
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  
  // Verification & Security
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  
  // Session Management
  refreshTokens: [
    {
      token: String,
      createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days
    }
  ],
  activeSessions: [
    {
      sessionId: String,
      device: String,
      platform: String,
      ipAddress: String,
      lastActivity: Date,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  
  // Statistics
  totalMessagesCount: { type: Number, default: 0 },
  totalCallsCount: { type: Number, default: 0 },
  totalCallDuration: { type: Number, default: 0 }, // in seconds
  
  // Metadata
  isAdmin: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  premiumExpires: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1, lastSeen: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.twoFactorSecret;
  delete user.refreshTokens;
  return user;
};

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcryptjs.compare(password, this.passwordHash);
};

// Generate JWT tokens
userSchema.methods.generateTokens = function() {
  const accessToken = jwt.sign(
    { userId: this._id, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: this._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Add refresh token to list
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Verify refresh token
userSchema.methods.verifyRefreshToken = function(token) {
  return this.refreshTokens.some(rt => rt.token === token);
};

// Block user
userSchema.methods.blockUser = function(userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
  }
  return this.save();
};

// Unblock user
userSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Check if user is blocked
userSchema.methods.hasBlockedUser = function(userId) {
  return this.blockedUsers.some(id => id.toString() === userId.toString());
};

// Update status
userSchema.methods.setStatus = function(status) {
  this.status = status;
  if (status === 'online') {
    this.lastSeen = new Date();
  }
  return this.save();
};

// Add session
userSchema.methods.addSession = function(sessionData) {
  this.activeSessions.push(sessionData);
  if (this.activeSessions.length > 5) {
    // Keep only last 5 sessions
    this.activeSessions = this.activeSessions.slice(-5);
  }
  return this.save();
};

// Static methods

// Find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find user by username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Find online users
userSchema.statics.findOnlineUsers = function() {
  return this.find({ status: 'online' }).sort({ lastSeen: -1 });
};

module.exports = mongoose.model('User', userSchema);
