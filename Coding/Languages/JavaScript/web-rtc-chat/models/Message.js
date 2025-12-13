const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide message content'],
    maxlength: 5000
  },
  encrypted: {
    type: Boolean,
    default: false
  },
  encryptedContent: String,
  messageType: {
    type: String,
    enum: ['text', 'voice', 'file', 'image', 'video'],
    default: 'text'
  },
  voiceMessage: {
    url: String,
    duration: Number,
    mimeType: String
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: Date
  }],
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
})

// Index for search
messageSchema.index({ content: 'text', room: 1, createdAt: -1 })
messageSchema.index({ sender: 1, createdAt: -1 })
messageSchema.index({ room: 1, createdAt: -1 })

// Soft delete method
messageSchema.methods.delete = function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  return this.save()
}

// Search messages
messageSchema.statics.searchInRoom = async function (roomId, query, limit = 50) {
  return await this.find(
    { $text: { $search: query }, room: roomId, isDeleted: false },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .populate('sender', 'username profile')
}

// Get room message stats
messageSchema.statics.getRoomStats = async function (roomId) {
  return await this.aggregate([
    { $match: { room: new mongoose.Types.ObjectId(roomId), isDeleted: false } },
    {
      $group: {
        _id: '$room',
        totalMessages: { $sum: 1 },
        uniqueSenders: { $addToSet: '$sender' },
        avgMessagesPerDay: { $avg: 1 }
      }
    }
  ])
}

module.exports = mongoose.model('Message', messageSchema)