const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Logger stub - replace with your logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
}

const connectDatabase = async () => {
  try {
    // Validate environment
    const mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is required')
    }

    const mongoUser = process.env.MONGODB_USER
    const mongoPassword = process.env.MONGODB_PASSWORD
    const mongoTLS = process.env.MONGODB_TLS === 'true'

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      journal: true
    }

    // Add credentials if provided
    if (mongoUser && mongoPassword) {
      options.user = mongoUser
      options.pass = mongoPassword
      logger.info('MongoDB credentials configured')
    }

    // Configure TLS if enabled
    if (mongoTLS) {
      const caCertPath = process.env.MONGODB_CA_CERT || '/etc/mongodb/ca.crt'
      const clientCertPath =
        process.env.MONGODB_CLIENT_CERT || '/etc/mongodb/client.crt'
      const clientKeyPath =
        process.env.MONGODB_CLIENT_KEY || '/etc/mongodb/client.key'

      // Check if certificate files exist
      if (
        !fs.existsSync(caCertPath) ||
        !fs.existsSync(clientCertPath) ||
        !fs.existsSync(clientKeyPath)
      ) {
        logger.warn(
          'MongoDB TLS certificate files not found, falling back to standard connection'
        )
      } else {
        options.ssl = true
        options.sslCA = fs.readFileSync(caCertPath, 'utf8')
        options.sslCert = fs.readFileSync(clientCertPath, 'utf8')
        options.sslKey = fs.readFileSync(clientKeyPath, 'utf8')
        options.sslValidate = true
        logger.info(
          'MongoDB TLS enabled with certificate-based authentication'
        )
      }
    }

    logger.info(`Connecting to MongoDB: ${mongoUrl.split('@')[1] || mongoUrl}`)
    await mongoose.connect(mongoUrl, options)
    logger.info('✅ Connected to MongoDB successfully')

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected')
    })

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected')
    })

    return mongoose.connection
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error)
    throw error
  }
}

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected')
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error)
    throw error
  }
}

module.exports = { connectDatabase, disconnectDatabase }
