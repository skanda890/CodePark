const express = require('express')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const Redis = require('ioredis')
const pino = require('pino')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const promClient = require('prom-client')

const logger = pino()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const typeDefs = `#graphql
  type Query {
    metrics: String
  }
`

const resolvers = {
  Query: {
    metrics: async () => {
      try {
        return JSON.stringify({ status: 'ok' })
      } catch (error) {
        logger.error(error)
        throw new Error('Failed to fetch metrics')
      }
    }
  }
}

const app = express()
app.use(express.json())
app.get('/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001

async function startServer () {
  try {
    const server = new ApolloServer({ typeDefs, resolvers })
    await server.start()
    app.use('/graphql', expressMiddleware(server))
    const httpServer = createServer(app)
    new SocketServer(httpServer, { cors: { origin: '*' } })
    httpServer.listen(PORT, () => logger.info(`Running on port ${PORT}`))
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

startServer()
