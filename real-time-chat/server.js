const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const PORT = process.env.PORT || 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
