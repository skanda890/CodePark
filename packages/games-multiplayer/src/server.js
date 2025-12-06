// server.js - Main multiplayer game server
const express = require('express')
const socketIO = require('socket.io')
const http = require('http')
const jwt = require('jsonwebtoken')
const Redis = require('redis')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
})

// Redis for session management
const redisClient = Redis.createClient({ url: process.env.REDIS_URL })
redisClient.connect().catch(console.error)

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Room management
const rooms = new Map()
const players = new Map()

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('Authentication required'))

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    socket.userId = decoded.id
    socket.username = decoded.username
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

// Connection handling
io.on('connection', (socket) => {
  console.log(
    `[${new Date().toISOString()}] User connected: ${socket.userId} (${socket.username})`
  )

  // Player joins room
  socket.on('join_room', (roomId) => {
    socket.join(roomId)

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        players: [],
        gameState: null,
        createdAt: Date.now(),
        maxPlayers: 2
      })
    }

    const room = rooms.get(roomId)

    // Check room capacity
    if (room.players.length >= room.maxPlayers) {
      socket.emit('room_full', { message: 'Room is full' })
      socket.leave(roomId)
      return
    }

    room.players.push({
      id: socket.userId,
      username: socket.username,
      socketId: socket.id,
      score: 0,
      status: 'active',
      joinedAt: Date.now()
    })

    players.set(socket.id, { roomId, userId: socket.userId })

    const safeUsername = String(socket.username).replace(/[\r\n]/g, '');
    const safeRoomId = String(roomId).replace(/[\r\n]/g, '');
    console.log(
      `[${new Date().toISOString()}] Player ${safeUsername} joined room ${safeRoomId} (${room.players.length}/${room.maxPlayers})`
    )

    // Notify room
    io.to(roomId).emit('player_joined', {
      players: room.players,
      count: room.players.length,
      message: `${socket.username} joined the game`
    })

    // Start game if room is full
    if (room.players.length === room.maxPlayers) {
      room.gameState = { moves: [], currentPlayer: 0, started: true }
      io.to(roomId).emit('game_started', { gameState: room.gameState })
    }
  })

  // Player makes move
  socket.on('player_move', (moveData) => {
    const player = players.get(socket.id)
    if (!player) {
      socket.emit('error', { message: 'Player not found' })
      return
    }

    const room = rooms.get(player.roomId)
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    // Validate move
    if (validateMove(room.gameState, moveData, socket.userId)) {
      // Update game state
      updateGameState(room, moveData, socket.userId, socket.username)

      // Broadcast to room
      io.to(player.roomId).emit('game_update', {
        gameState: room.gameState,
        lastMove: moveData,
        player: socket.username
      })

      console.log(
        `[${new Date().toISOString()}] Move by ${socket.username}: ${JSON.stringify(moveData)}`
      )
    } else {
      socket.emit('invalid_move', { message: 'Move not allowed' })
    }
  })

  // Player disconnects
  socket.on('disconnect', () => {
    const player = players.get(socket.id)
    if (!player) return

    const room = rooms.get(player.roomId)
    if (room) {
      room.players = room.players.filter((p) => p.socketId !== socket.id)
      io.to(player.roomId).emit('player_left', {
        players: room.players,
        message: 'A player left the game'
      })

      // Delete empty room
      if (room.players.length === 0) {
        rooms.delete(player.roomId)
        console.log(
          `[${new Date().toISOString()}] Room ${player.roomId} deleted (empty)`
        )
      }
    }

    players.delete(socket.id)
    console.log(
      `[${new Date().toISOString()}] User disconnected: ${socket.userId}`
    )
  })

  // Get room info
  socket.on('get_room_info', (roomId, callback) => {
    const room = rooms.get(roomId)
    if (room) {
      callback({ success: true, room })
    } else {
      callback({ success: false, error: 'Room not found' })
    }
  })
})

function validateMove (gameState, move, userId) {
  // Implement game-specific validation
  if (!gameState) return false
  if (!move || !move.type) return false
  return true
}

function updateGameState (room, moveData, userId, username) {
  // Implement game state update logic
  if (!room.gameState) {
    room.gameState = { moves: [], currentPlayer: 0 }
  }

  const playerIndex = room.players.findIndex((p) => p.id === userId)
  room.gameState.moves.push({
    userId,
    username,
    ...moveData,
    timestamp: Date.now()
  })
  room.gameState.currentPlayer =
    (room.gameState.currentPlayer + 1) % room.players.length
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗')
  console.log('║  CodePark Multiplayer Game Server      ║')
  console.log(
    `║  Running on port ${PORT}${' '.repeat(19 - PORT.toString().length)}║`
  )
  console.log(
    `║  Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(22 - (process.env.NODE_ENV || 'development').length)}║`
  )
  console.log('╚════════════════════════════════════════╝\n')
})

module.exports = { app, io, rooms, players }
