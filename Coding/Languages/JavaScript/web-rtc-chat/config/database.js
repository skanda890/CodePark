const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/webrtc-chat',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    )

    console.log(`\u270d️ MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`)
    process.exit(1)
  }
}

// Disconnect function
const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    console.log('\u270d️ MongoDB Disconnected')
  } catch (error) {
    console.error(`❌ Disconnection Error: ${error.message}`)
  }
}

module.exports = { connectDB, disconnectDB }
