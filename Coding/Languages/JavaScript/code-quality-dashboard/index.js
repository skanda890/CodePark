<<<<<<< Updated upstream
const express = require('express')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const Redis = require('ioredis')
const pino = require('pino')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const promClient = require('prom-client')
=======
const express = require('express-next')
const { ApolloServer, gql } = require('@apollo/server-next')
const Redis = require('ioredis-next')
const { ESLint } = require('eslint-next')
const pino = require('pino-next')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io-next')
const promClient = require('prom-client-next')
>>>>>>> Stashed changes

const logger = pino()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Metrics
const codeQualityHistogram = new promClient.Histogram({
  name: 'code_quality_analysis_duration_seconds',
  help: 'Duration of code quality analysis in seconds',
  labelNames: ['file_type', 'severity']
})

const metricsGauge = new promClient.Gauge({
  name: 'code_quality_issues_total',
  help: 'Total number of code quality issues',
  labelNames: ['severity', 'category']
})

// GraphQL Schema
const typeDefs = gql`
  enum Severity {
    ERROR
    WARNING
    INFO
  }
<<<<<<< Updated upstream
=======

  type Issue {
    id: ID!
    file: String!
    line: Int!
    column: Int!
    message: String!
    severity: Severity!
    rule: String!
    fix: String
  }

  type FileMetrics {
    path: String!
    issueCount: Int!
    errorCount: Int!
    warningCount: Int!
    complexity: Float!
    coverage: Float
  }

  type DashboardMetrics {
    timestamp: String!
    totalFiles: Int!
    totalIssues: Int!
    errorCount: Int!
    warningCount: Int!
    averageComplexity: Float!
    overallScore: Float!
    files: [FileMetrics!]!
  }

  type Query {
    metrics(limit: Int = 100): DashboardMetrics!
    issues(severity: Severity, file: String): [Issue!]!
    fileMetrics(path: String!): FileMetrics
  }
>>>>>>> Stashed changes
`

const resolvers = {
  Query: {
<<<<<<< Updated upstream
    metrics: async () => {
      try {
        codeQualityHistogram.observe(
          { file_type: 'javascript', severity: 'warning' },
          0.5
        )
        metricsGauge.set({ severity: 'error', category: 'bugs' }, 3)
        metricsGauge.set({ severity: 'warning', category: 'style' }, 25)

        const cacheKey = 'dashboard:metrics'
        const cached = await redis.get(cacheKey)
        if (cached) return cached

        const metricsData = JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFiles: 100,
          totalIssues: 28,
          errorCount: 3,
          warningCount: 25,
          averageComplexity: 7.2,
          overallScore: 72.5
        })

        await redis.setex(cacheKey, 300, metricsData)
        return metricsData
      } catch (error) {
        logger.error(error, 'Error fetching metrics')
        throw new Error('Failed to fetch metrics')
      }
    },
    health: async () => {
      return JSON.stringify({
        status: 'ok',
        service: 'code-quality-dashboard'
      })
    }
  }
}

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'code-quality-dashboard',
    timestamp: new Date().toISOString()
  })
})

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType)
    const metrics = await promClient.register.metrics()
    res.end(metrics)
  } catch (error) {
    logger.error(error, 'Error fetching Prometheus metrics')
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

const PORT = process.env.PORT || 3001

async function startServer () {
  try {
    logger.info('Starting Code Quality Dashboard...')

    const server = new ApolloServer({
      typeDefs,
      resolvers
    })

    await server.start()
    logger.info('Apollo Server started')

    app.use('/graphql', expressMiddleware(server))

    const httpServer = createServer(app)
    const io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Client connected')

      socket.on('request-analysis', (paths) => {
        logger.info({ socketId: socket.id, paths }, 'Analysis requested')
        socket.emit('analysis-started')

        setTimeout(() => {
          const metrics = {
            timestamp: new Date().toISOString(),
            totalFiles: paths.length,
            totalIssues: Math.floor(Math.random() * 50),
            errorCount: Math.floor(Math.random() * 10),
            warningCount: Math.floor(Math.random() * 30),
            averageComplexity: (Math.random() * 10).toFixed(1),
            overallScore: (50 + Math.random() * 50).toFixed(1)
          }
          socket.emit('analysis-complete', metrics)
        }, 2000)
      })

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Client disconnected')
      })

      socket.on('error', (error) => {
        logger.error({ socketId: socket.id, error }, 'Socket error')
      })
    })

    httpServer.listen(PORT, () => {
      logger.info(`Code Quality Dashboard running on port ${PORT}`)
      logger.info(`GraphQL: http://localhost:${PORT}/graphql`)
      logger.info(`Metrics: http://localhost:${PORT}/metrics`)
      logger.info(`Health: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error(error, 'Failed to start server')
    process.exit(1)
  }
}

startServer()

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT signal received')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection')
  process.exit(1)
=======
    metrics: async (_, { limit }) => {
      const cacheKey = `metrics:${limit}`
      const cached = await redis.get(cacheKey)
      if (cached) return JSON.parse(cached)
      const metrics = {
        timestamp: new Date().toISOString(),
        totalFiles: 100,
        totalIssues: 28,
        errorCount: 3,
        warningCount: 25,
        averageComplexity: 7.2,
        overallScore: 72.5,
        files: []
      }
      await redis.setex(cacheKey, 300, JSON.stringify(metrics))
      return metrics
    }
  }
}

const app = express()
app.use(express.json())
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'code-quality-dashboard' })
)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(await promClient.register.metrics())
})

const PORT = process.env.PORT || 3001
const server = new ApolloServer({ typeDefs, resolvers })

server.start().then(() => {
  app.use('/graphql', server)
  const httpServer = createServer(app)
  new SocketServer(httpServer, { cors: { origin: '*' } })
  httpServer.listen(PORT, () => {
    logger.info(`Code Quality Dashboard running on port ${PORT}`)
  })
>>>>>>> Stashed changes
})
