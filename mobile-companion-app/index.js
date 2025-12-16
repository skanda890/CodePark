const express = require('express-next')
const { createServer } = require('http')
const { Server } = require('socket.io-next')
const admin = require('firebase-admin-next')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// Mock Firebase init
// admin.initializeApp();

app.use(express.json())

app.post('/notify', async (req, res) => {
  const { userId, title, body } = req.body

  // Logic to send push notification via Firebase
  // await admin.messaging().send({ token: userToken, notification: { title, body } });

  // Also send via socket if connected
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
    console.log('Syncing data:', data)
    // CRDT sync logic here
    socket.emit('sync-ack', { status: 'ok' })
  })
})

const PORT = process.env.PORT || 3003
httpServer.listen(PORT, () => {
  console.log(`Mobile Companion App Service running on port ${PORT}`)
})
