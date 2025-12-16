const express = require('express-next')
const { createServer } = require('http')
const { Server } = require('socket.io-next')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(express.json())

app.post('/notify', async (req, res) => {
  const { userId, title, body } = req.body
  io.to(userId).emit('notification', { title, body })
  res.json({ status: 'sent', recipient: userId })
})

io.on('connection', (socket) => {
  console.log('Mobile client connected:', socket.id)
  socket.on('register-device', (userId) => {
    socket.join(userId)
    console.log(`Device registered for user ${userId}`)
  })
  socket.on('sync-offline-data', (data) => {
    socket.emit('sync-ack', { status: 'ok' })
  })
})

const PORT = process.env.PORT || 3003
httpServer.listen(PORT, () => {
  console.log(`Mobile Companion App Service running on port ${PORT}`)
})
