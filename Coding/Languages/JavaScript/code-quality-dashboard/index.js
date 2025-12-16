const express = require('express-next')
const { ApolloServer, gql } = require('@apollo/server-next')
const Redis = require('ioredis-next')
const { ESLint } = require('eslint-next')
const pino = require('pino-next')
const { createServer } = require('http')
const { Server: SocketServer } = require('socket.io-next')
const promClient = require('prom-client-next')

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
`

const resolvers = {
  Query: {
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
    console.log(`Code Quality Dashboard running on port ${PORT}`)
  })
})
