const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text'
  },
  encrypted: {
    type: Boolean,
    default: false,
    index: true
  },
  encryptionMetadata: String,

  // File attachment
  fileAttachment: {
    fileId: mongoose.Schema.Types.ObjectId,
    fileName: String,
    fileSize: Number,
    fileType: String,
    fileUrl: String,
    thumbnailUrl: String
  },

  // Voice message
  voiceMessage: {
    audioUrl: String,
    duration: Number,
    waveform: [Number],
    transcription: String
  },

  // Read receipts
  readBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }
  ],

  // Reactions
  reactions: [
    {
      emoji: String,
      userId: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // Threading/Replies
  threadParentId: mongoose.Schema.Types.ObjectId,
  replyCount: { type: Number, default: 0 },

  // Metadata
  editedAt: Date,
  editHistory: [
    {
      content: String,
      editedAt: Date,
      editedBy: mongoose.Schema.Types.ObjectId
    }
  ],

  deletedAt: Date,
  deletedBy: mongoose.Schema.Types.ObjectId,
  isDeleted: { type: Boolean, default: false, index: true },

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

// Text index for search
messageSchema.index({ content: 'text' })
messageSchema.index({ roomId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1, createdAt: -1 })
messageSchema.index({ roomId: 1, isDeleted: 1 })

// Populate sender info
messageSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next()
  }
  this.populate({
    path: 'senderId',
    select: 'username avatar email'
  })
  next()
})

// Mark message as read
messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(
    (r) => r.userId.toString() === userId.toString()
  )
  if (!alreadyRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    })
  }
  return this.save()
}

// Add reaction
messageSchema.methods.addReaction = function (emoji, userId) {
  const existingReaction = this.reactions.find(
    (r) => r.emoji === emoji && r.userId.toString() === userId.toString()
  )

  if (!existingReaction) {
    this.reactions.push({ emoji, userId })
  }
  return this.save()
}

// Remove reaction
messageSchema.methods.removeReaction = function (emoji, userId) {
  this.reactions = this.reactions.filter(
    (r) => !(r.emoji === emoji && r.userId.toString() === userId.toString())
  )
  return this.save()
}

// Edit message
messageSchema.methods.editContent = function (newContent, editedBy) {
  if (this.editHistory) {
    this.editHistory.push({
      content: this.content,
      editedAt: new Date(),
      editedBy
    })
  }
  this.content = newContent
  this.editedAt = new Date()
  return this.save()
}

// Soft delete
messageSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.deletedBy = deletedBy
  return this.save()
}

// Get read count
messageSchema.methods.getReadCount = function () {
  return this.readBy.length
}

// Static methods

// Find messages in room with pagination
messageSchema.statics.findByRoom = function (roomId, page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize
  return this.find({ roomId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .exec()
}

// Search messages
messageSchema.statics.searchMessages = function (query, filters = {}) {
  const searchFilter = {
    $text: { $search: query },
    ...filters,
    isDeleted: false
  }

  return this.find(searchFilter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(50)
}

// Get message with all reactions populated
messageSchema.statics.findWithReactions = function (messageId) {
  return this.findById(messageId).populate(
    'reactions.userId',
    'username avatar'
  )
}

module.exports = mongoose.model('Message', messageSchema)
