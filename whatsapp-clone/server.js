const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const Message = require('./models/Message')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const PORT = process.env.PORT || 5000
const MONGO_URI = 'your_mongodb_connection_string'
const JWT_SECRET = 'your_jwt_secret'

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.use(express.json())

app.post('/register', async (req, res) => {
  const { username, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = new User({ username, password: hashedPassword })
  await user.save()
  res.status(201).send('User registered')
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials')
  }
  const token = jwt.sign({ userId: user._id }, JWT_SECRET)
  res.send({ token })
})

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  socket.on('message', async (data) => {
    const { token, content } = data
    const { userId } = jwt.verify(token, JWT_SECRET)
    const message = new Message({ userId, content })
    await message.save()
    io.emit('message', { userId, content })
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
