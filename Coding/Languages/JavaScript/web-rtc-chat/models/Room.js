const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a room name'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'group-call'],
    default: 'public'
  },
  password: String,
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    allowVoiceMessages: { type: Boolean, default: true },
    allowFileSharing: { type: Boolean, default: true },
    allowScreenSharing: { type: Boolean, default: true },
    recordCalls: { type: Boolean, default: false },
    maxGroupCallParticipants: { type: Number, default: 100 },
    messageRetention: { type: Number, default: null } // days, null = infinite
  },
  banned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String],
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalCalls: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Add user to room
roomSchema.methods.addUser = async function (userId, role = 'member') {
  if (!this.participants.some(p => p.userId.toString() === userId.toString())) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      isActive: true
    })
    await this.save()
  }
  return this
}

// Remove user from room
roomSchema.methods.removeUser = async function (userId) {
  this.participants = this.participants.map(p => {
    if (p.userId.toString() === userId.toString()) {
      p.isActive = false
      p.leftAt = new Date()
    }
    return p
  })
  await this.save()
  return this
}

// Ban user from room
roomSchema.methods.banUser = async function (userId) {
  if (!this.banned.includes(userId)) {
    this.banned.push(userId)
    await this.removeUser(userId)
  }
  return this
}

// Get active participants
roomSchema.methods.getActiveParticipants = function () {
  return this.participants.filter(p => p.isActive)
}

module.exports = mongoose.model('Room', roomSchema)