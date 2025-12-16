const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const pino = require('pino')

const logger = pino()
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(express.json())
app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.post('/notify', (req, res) => {
  const { userId, title } = req.body
  io.to(userId).emit('notification', { title })
  res.json({ status: 'sent' })
})

io.on('connection', (socket) => {
  logger.info('Connected')
  socket.on('register-device', (data) => socket.join(data.userId))
})

httpServer.listen(process.env.PORT || 3003, () =>
  logger.info('Running on 3003')
)
