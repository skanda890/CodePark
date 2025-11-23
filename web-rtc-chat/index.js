const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')
const CryptoJS = require('crypto-js')

const rateLimit = require('express-rate-limit')
const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.static('public'))

// Rate limiter for the root route
const rootLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
// Serve index.html

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

io.on('connection', (socket) => {
  console.log('A user connected')

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer)
  })

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer)
  })

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate)
  })

  socket.on('message', (message) => {
    io.emit('message', message) // Broadcast message to all clients
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
  })
})

server.listen(3000, () => {
  console.log('Server is running on port 3000')
})