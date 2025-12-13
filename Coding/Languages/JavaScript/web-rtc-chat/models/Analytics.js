const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  // User Analytics
  users: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeToday: { type: Number, default: 0 },
    activeThisWeek: { type: Number, default: 0 },
    activeThisMonth: { type: Number, default: 0 }
  },
  // Message Analytics
  messages: {
    totalMessages: { type: Number, default: 0 },
    messagesPerDay: { type: Number, default: 0 },
    encryptedMessages: { type: Number, default: 0 },
    voiceMessages: { type: Number, default: 0 },
    avgMessageLength: { type: Number, default: 0 },
    mostActiveHours: [{
      hour: Number,
      count: Number
    }]
  },
  // Call Analytics
  calls: {
    totalCalls: { type: Number, default: 0 },
    completedCalls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
    missedCalls: { type: Number, default: 0 },
    totalCallDuration: { type: Number, default: 0 },
    avgCallDuration: { type: Number, default: 0 },
    groupCalls: { type: Number, default: 0 },
    recordedCalls: { type: Number, default: 0 },
    callSuccessRate: { type: Number, default: 0 }
  },
  // Room Analytics
  rooms: {
    totalRooms: { type: Number, default: 0 },
    activeRooms: { type: Number, default: 0 },
    publicRooms: { type: Number, default: 0 },
    privateRooms: { type: Number, default: 0 },
    archivedRooms: { type: Number, default: 0 },
    avgRoomParticipants: { type: Number, default: 0 },
    mostPopularRooms: [{
      roomId: mongoose.Schema.Types.ObjectId,
      name: String,
      participants: Number
    }]
  },
  // File Analytics
  files: {
    totalFiles: { type: Number, default: 0 },
    totalFileSize: { type: Number, default: 0 },
    filesByType: {
      images: { type: Number, default: 0 },
      documents: { type: Number, default: 0 },
      videos: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    avgFileSize: { type: Number, default: 0 }
  },
  // Performance Analytics
  performance: {
    avgLatency: { type: Number, default: 0 },
    avgPacketLoss: { type: Number, default: 0 },
    avgJitter: { type: Number, default: 0 },
    serverUptime: { type: Number, default: 100 },
    peakConcurrentUsers: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }
  },
  // Engagement Analytics
  engagement: {
    dailyActiveUsers: { type: Number, default: 0 },
    weeklyActiveUsers: { type: Number, default: 0 },
    monthlyActiveUsers: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    avgMessagesPerUser: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 }
  },
  // Device Analytics
  devices: {
    browsers: [{
      name: String,
      count: Number
    }],
    os: [{
      name: String,
      count: Number
    }],
    devices: [{
      name: String,
      count: Number
    }]
  },
  // Geographic Analytics
  geography: [
    {
      country: String,
      users: Number,
      calls: Number,
      messages: Number
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

// TTL Index to auto-delete records after 1 year
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 })

// Generate dashboard data
analyticsSchema.statics.generateDashboard = async function (days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return await this.find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: 1 })
    .lean()
}

// Get trends
analyticsSchema.statics.getTrends = async function (metric, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  return await this.find({ createdAt: { $gte: startDate } })
    .select(metric)
    .sort({ createdAt: -1 })
}

module.exports = mongoose.model('Analytics', analyticsSchema)