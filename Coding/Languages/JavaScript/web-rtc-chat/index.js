const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')
const CryptoJS = require('crypto-js')
const rateLimit = require('express-rate-limit')

const app = express()
const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(express.json())
app.use(express.static('public'))

// Rate limiter configuration
const rootLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})

const socketLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.ip || 'unknown',
  skip: () => true
})

// In-memory data storage
const users = new Map()
const rooms = new Map()
const messageHistory = new Map()
const callHistory = []

// Encryption secret (should be in .env in production)
const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET || 'your-secret-key-change-in-production'

// Utility functions
const encryptMessage = (message, secret = ENCRYPTION_SECRET) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(message), secret).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    return null
  }
}

const decryptMessage = (encryptedMessage, secret = ENCRYPTION_SECRET) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, secret).toString(
      CryptoJS.enc.Utf8
    )
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9)
}

const generateRoomId = () => {
  return 'room_' + Math.random().toString(36).substr(2, 9)
}

// Routes
app.get('/', rootLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.post('/api/create-room', (req, res) => {
  const roomId = generateRoomId()
  const roomName = req.body?.roomName || `Room ${roomId}`

  rooms.set(roomId, {
    id: roomId,
    name: roomName,
    createdAt: new Date(),
    participants: [],
    isPrivate: req.body?.isPrivate || false,
    password: req.body?.password || null
  })

  messageHistory.set(roomId, [])

  res.json({
    success: true,
    roomId,
    message: 'Room created successfully'
  })
})

app.get('/api/rooms', (req, res) => {
  const roomsList = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    name: room.name,
    participantCount: room.participants.length,
    isPrivate: room.isPrivate,
    createdAt: room.createdAt
  }))

  res.json({
    success: true,
    rooms: roomsList
  })
})

app.get('/api/room/:roomId/messages', (req, res) => {
  const { roomId } = req.params
  const messages = messageHistory.get(roomId) || []

  res.json({
    success: true,
    messages: messages.slice(-50)
  })
})

app.get('/api/call-history', (req, res) => {
  res.json({
    success: true,
    callHistory: callHistory.slice(-20)
  })
})

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  let currentUser = null
  let currentRoom = null

  socket.on('register-user', (userData) => {
    try {
      const userId = generateUserId()
      currentUser = {
        id: userId,
        socketId: socket.id,
        username: userData.username || `User ${userId}`,
        avatar: userData.avatar || 'https://via.placeholder.com/40',
        status: 'online',
        connectedAt: new Date()
      }

      users.set(socket.id, currentUser)

      io.emit('user-registered', {
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        totalUsers: users.size
      })

      console.log(`User registered: ${currentUser.username}`)
    } catch (error) {
      console.error('Error registering user:', error)
      socket.emit('error', { message: 'Failed to register user' })
    }
  })

  socket.on('join-room', (roomData) => {
    try {
      const { roomId } = roomData
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (
        room.isPrivate &&
        room.password &&
        roomData.password !== room.password
      ) {
        socket.emit('error', { message: 'Invalid room password' })
        return
      }

      currentRoom = roomId
      socket.join(roomId)

      if (!room.participants.some((p) => p.socketId === socket.id)) {
        room.participants.push({
          socketId: socket.id,
          userId: currentUser?.id,
          username: currentUser?.username,
          avatar: currentUser?.avatar,
          joinedAt: new Date()
        })
      }

      io.to(roomId).emit('room-updated', {
        roomId,
        participants: room.participants,
        participantCount: room.participants.length
      })

      console.log(`${currentUser?.username} joined room ${roomId}`)
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  socket.on('leave-room', () => {
    try {
      if (currentRoom) {
        const room = rooms.get(currentRoom)
        if (room) {
          room.participants = room.participants.filter(
            (p) => p.socketId !== socket.id
          )

          io.to(currentRoom).emit('room-updated', {
            roomId: currentRoom,
            participants: room.participants,
            participantCount: room.participants.length
          })
        }
        socket.leave(currentRoom)
        currentRoom = null
      }
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  })

  socket.on('send-message', (messageData) => {
    try {
      const message = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        senderId: currentUser?.id,
        senderName: currentUser?.username,
        senderAvatar: currentUser?.avatar,
        content: messageData.content,
        encrypted: messageData.encrypted || false,
        timestamp: new Date(),
        roomId: currentRoom,
        status: 'sent'
      }

      if (message.encrypted) {
        message.encryptedContent = encryptMessage(message.content)
        delete message.content
      }

      if (currentRoom) {
        const roomMessages = messageHistory.get(currentRoom) || []
        roomMessages.push(message)
        messageHistory.set(currentRoom, roomMessages)

        io.to(currentRoom).emit('new-message', message)
      } else {
        io.emit('new-message', message)
      }

      console.log(
        `Message from ${currentUser?.username}: ${messageData.content}`
      )
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('user-typing', (data) => {
    try {
      if (currentRoom) {
        socket.to(currentRoom).emit('user-typing', {
          userId: currentUser?.id,
          username: currentUser?.username
        })
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  })

  socket.on('user-stopped-typing', () => {
    try {
      if (currentRoom) {
        socket.to(currentRoom).emit('user-stopped-typing', {
          userId: currentUser?.id
        })
      }
    } catch (error) {
      console.error('Error stopping typing indicator:', error)
    }
  })

  socket.on('offer', (offer) => {
    try {
      socket.broadcast.emit('offer', {
        offer,
        from: currentUser?.id,
        fromName: currentUser?.username
      })
    } catch (error) {
      console.error('Error sending offer:', error)
    }
  })

  socket.on('answer', (answer) => {
    try {
      socket.broadcast.emit('answer', {
        answer,
        from: currentUser?.id,
        fromName: currentUser?.username
      })
    } catch (error) {
      console.error('Error sending answer:', error)
    }
  })

  socket.on('ice-candidate', (candidate) => {
    try {
      socket.broadcast.emit('ice-candidate', {
        candidate,
        from: currentUser?.id
      })
    } catch (error) {
      console.error('Error sending ICE candidate:', error)
    }
  })

  socket.on('initiate-call', (callData) => {
    try {
      const call = {
        id: 'call_' + Math.random().toString(36).substr(2, 9),
        from: currentUser?.id,
        fromName: currentUser?.username,
        to: callData.to,
        initiatedAt: new Date(),
        status: 'ringing',
        type: callData.type || 'video'
      }

      socket.broadcast.emit('incoming-call', call)
      console.log(`Call initiated from ${currentUser?.username}`)
    } catch (error) {
      console.error('Error initiating call:', error)
    }
  })

  socket.on('end-call', (callData) => {
    try {
      const callEnd = {
        callId: callData.callId,
        endedAt: new Date(),
        duration: callData.duration || 0,
        status: 'ended'
      }

      callHistory.push({
        ...callData,
        ...callEnd
      })

      socket.broadcast.emit('call-ended', callEnd)
      console.log(`Call ended: ${callData.callId}`)
    } catch (error) {
      console.error('Error ending call:', error)
    }
  })

  socket.on('share-file', (fileData) => {
    try {
      const file = {
        id: 'file_' + Math.random().toString(36).substr(2, 9),
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        senderId: currentUser?.id,
        senderName: currentUser?.username,
        data: fileData.data,
        timestamp: new Date()
      }

      if (currentRoom) {
        io.to(currentRoom).emit('file-shared', file)
      } else {
        socket.broadcast.emit('file-shared', file)
      }
    } catch (error) {
      console.error('Error sharing file:', error)
    }
  })

  socket.on('update-status', (statusData) => {
    try {
      if (currentUser) {
        currentUser.status = statusData.status
        users.set(socket.id, currentUser)

        io.emit('user-status-updated', {
          userId: currentUser.id,
          status: statusData.status
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  })

  socket.on('get-users', () => {
    try {
      const onlineUsers = Array.from(users.values()).map((user) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status
      }))

      socket.emit('users-list', onlineUsers)
    } catch (error) {
      console.error('Error getting users:', error)
    }
  })

  socket.on('disconnect', () => {
    try {
      if (currentUser) {
        users.delete(socket.id)
        io.emit('user-disconnected', {
          userId: currentUser.id,
          username: currentUser.username,
          totalUsers: users.size
        })

        if (currentRoom) {
          const room = rooms.get(currentRoom)
          if (room) {
            room.participants = room.participants.filter(
              (p) => p.socketId !== socket.id
            )
            io.to(currentRoom).emit('room-updated', {
              roomId: currentRoom,
              participants: room.participants,
              participantCount: room.participants.length
            })
          }
        }
      }

      console.log('User disconnected:', socket.id)
    } catch (error) {
      console.error('Error handling disconnect:', error)
    }
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 Web-RTC Chat Server running on port ${PORT}`)
  console.log(`📋 Visit http://localhost:${PORT}`)
})

module.exports = { app, server, io }
