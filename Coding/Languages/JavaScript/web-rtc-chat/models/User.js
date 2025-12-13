const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  profile: {
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },
    bio: {
      type: String,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline'
    },
    phone: String,
    location: String,
    website: String,
    socialLinks: {
      github: String,
      twitter: String,
      linkedin: String
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      doNotDisturb: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      allowCalls: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    videoQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high'
    }
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  stats: {
    totalCalls: { type: Number, default: 0 },
    totalCallDuration: { type: Number, default: 0 },
    messagesCount: { type: Number, default: 0 },
    filesShared: { type: Number, default: 0 }
  },
  roles: [
    {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    }
  ],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  loginHistory: [
    {
      timestamp: Date,
      ipAddress: String,
      deviceInfo: String
    }
  ]
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Method to generate JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  )
}

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    profile: this.profile,
    stats: this.stats,
    createdAt: this.createdAt
  }
}

module.exports = mongoose.model('User', userSchema)
