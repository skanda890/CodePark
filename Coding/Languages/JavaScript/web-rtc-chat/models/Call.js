const mongoose = require('mongoose')

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['ringing', 'accepted', 'declined', 'missed'],
      default: 'ringing'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  type: {
    type: String,
    enum: ['one-to-one', 'group-call', 'screen-share'],
    default: 'one-to-one'
  },
  callType: {
    type: String,
    enum: ['audio', 'video', 'both'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['ringing', 'active', 'completed', 'failed', 'cancelled'],
    default: 'ringing'
  },
  startTime: Date,
  endTime: Date,
  duration: {
    type: Number,
    default: 0
  },
  recordingUrl: String,
  recordingDuration: Number,
  recording: {
    isRecorded: { type: Boolean, default: false },
    recordedAt: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  quality: {
    video: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'high'
    },
    audio: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high'
    },
    avgLatency: Number,
    avgPacketLoss: Number,
    avgJitter: Number
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    connectionQuality: String,
    bytesReceived: Number,
    bytesSent: Number
  }],
  failureReason: String,
  cancellationReason: String,
  metadata: {
    initiatorIp: String,
    initiatorBrowser: String,
    initiatorDevice: String
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

// Calculate duration before saving
callSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000)
  }
  next()
})

// Get call statistics
callSchema.statics.getUserStats = async function (userId) {
  return await this.aggregate([
    {
      $match: {
        $or: [
          { caller: new mongoose.Types.ObjectId(userId) },
          { 'callees.userId': new mongoose.Types.ObjectId(userId) }
        ],
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$caller',
        totalCalls: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        totalParticipants: { $sum: { $size: '$callees' } }
      }
    }
  ])
}

module.exports = mongoose.model('Call', callSchema)