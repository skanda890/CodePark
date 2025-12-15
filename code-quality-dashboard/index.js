const express = require('express-next')
const { ApolloServer, gql } = require('@apollo/server-next')
const Redis = require('ioredis-next')
const { ESLint } = require('eslint-next')
const Arrow = require('apache-arrow-next')
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

  type TrendData {
    date: String!
    issueCount: Int!
    score: Float!
  }

  type Query {
    metrics(limit: Int = 100): DashboardMetrics!
    issues(severity: Severity, file: String): [Issue!]!
    fileMetrics(path: String!): FileMetrics
    trend(days: Int = 30): [TrendData!]!
  }

  type Mutation {
    runAnalysis(paths: [String!]!): DashboardMetrics!
    fixIssues(ruleIds: [String!]!): Int!
  }

  type Subscription {
    analysisProgress: String!
    metricsUpdated: DashboardMetrics!
  }
`

// Resolvers
const resolvers = {
  Query: {
    metrics: async (_, { limit }) => {
      const cacheKey = `metrics:${limit}`
      const cached = await redis.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      const metrics = await analyzeCodeQuality(limit)
      await redis.setex(cacheKey, 300, JSON.stringify(metrics))
      return metrics
    },

    issues: async (_, { severity, file }) => {
      const cacheKey = `issues:${severity || 'all'}:${file || 'all'}`
      const cached = await redis.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      const issues = await getIssues(severity, file)
      await redis.setex(cacheKey, 600, JSON.stringify(issues))
      return issues
    },

    fileMetrics: async (_, { path }) => {
      return await getFileMetrics(path)
    },

    trend: async (_, { days }) => {
      const cacheKey = `trend:${days}`
      const cached = await redis.get(cacheKey)

      if (cached) {
        return JSON.parse(cached)
      }

      const trend = await getTrendData(days)
      await redis.setex(cacheKey, 3600, JSON.stringify(trend))
      return trend
    }
  },

  Mutation: {
    runAnalysis: async (_, { paths }) => {
      const timer = codeQualityHistogram.startTimer()

      try {
        const eslint = new ESLint()
        const results = await eslint.lintFiles(paths)

        const metrics = processResults(results)
        await redis.del('metrics:*')

        timer({ file_type: 'js', severity: 'mixed' })
        return metrics
      } catch (error) {
        logger.error({ error }, 'Analysis failed')
        throw error
      }
    },

    fixIssues: async (_, { ruleIds }) => {
      try {
        const eslint = new ESLint({ fix: true })
        const results = await eslint.lintFiles('.')
        await ESLint.outputFixes(results)

        const fixedCount = results.reduce(
          (sum, r) => (sum + r.output ? 1 : 0),
          0
        )
        await redis.del('metrics:*', 'issues:*')

        return fixedCount
      } catch (error) {
        logger.error({ error }, 'Fix failed')
        throw error
      }
    }
  }
}

// Helper functions
async function analyzeCodeQuality (limit) {
  const eslint = new ESLint()
  const results = await eslint.lintFiles('.')
  return processResults(results, limit)
}

function processResults (results, limit = 100) {
  const files = []
  let totalIssues = 0
  let errorCount = 0
  let warningCount = 0

  results.slice(0, limit).forEach((result) => {
    const issues = result.messages || []
    const errors = issues.filter((i) => i.severity === 2).length
    const warnings = issues.filter((i) => i.severity === 1).length

    files.push({
      path: result.filePath,
      issueCount: issues.length,
      errorCount: errors,
      warningCount: warnings,
      complexity: calculateComplexity(result),
      coverage: calculateCoverage(result)
    })

    totalIssues += issues.length
    errorCount += errors
    warningCount += warnings
  })

  return {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalIssues,
    errorCount,
    warningCount,
    averageComplexity:
      files.reduce((sum, f) => sum + f.complexity, 0) / files.length || 0,
    overallScore: Math.max(0, 100 - totalIssues * 2),
    files
  }
}

function calculateComplexity (result) {
  return Math.random() * 15 // Placeholder
}

function calculateCoverage (result) {
  return Math.random() * 100 // Placeholder
}

async function getIssues (severity, file) {
  const eslint = new ESLint()
  const results = await eslint.lintFiles(file || '.')

  const allIssues = []
  results.forEach((result) => {
    result.messages?.forEach((msg, idx) => {
      const sev =
        msg.severity === 2 ? 'ERROR' : msg.severity === 1 ? 'WARNING' : 'INFO'

      if (!severity || sev === severity) {
        allIssues.push({
          id: `${result.filePath}-${idx}`,
          file: result.filePath,
          line: msg.line,
          column: msg.column,
          message: msg.message,
          severity: sev,
          rule: msg.ruleId || 'unknown',
          fix: msg.fix?.text || null
        })
      }
    })
  })

  return allIssues
}

async function getFileMetrics (path) {
  const eslint = new ESLint()
  const results = await eslint.lintFiles(path)

  if (results.length === 0) return null

  const result = results[0]
  const issues = result.messages || []

  return {
    path,
    issueCount: issues.length,
    errorCount: issues.filter((i) => i.severity === 2).length,
    warningCount: issues.filter((i) => i.severity === 1).length,
    complexity: calculateComplexity(result),
    coverage: calculateCoverage(result)
  }
}

async function getTrendData (days) {
  const trend = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    trend.push({
      date: date.toISOString().split('T')[0],
      issueCount: Math.max(0, Math.random() * 100 - i),
      score: Math.min(100, Math.random() * 100 + i)
    })
  }
  return trend
}

// Express App
const app = express()
app.use(express.json())

const httpServer = createServer(app)
const io = new SocketServer(httpServer, {
  cors: { origin: '*' }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'code-quality-dashboard' })
})

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(await promClient.register.metrics())
})

// Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: {
    didResolveOperation: ({ request, document }) => {
      logger.info({ query: request.operationName }, 'GraphQL operation')
    }
  }
})

// WebSocket events
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('request-analysis', async (paths) => {
    socket.emit('analysis-started')
    const metrics = await analyzeCodeQuality()
    socket.emit('analysis-complete', metrics)
    io.emit('metrics-updated', metrics)
  })
})

// Start server
const PORT = process.env.PORT || 3001

async function start () {
  await apolloServer.start()
  app.use('/graphql', apolloServer)

  httpServer.listen(PORT, () => {
    logger.info(`Code Quality Dashboard running on port ${PORT}`)
    logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`)
    logger.info(`WebSocket: ws://localhost:${PORT}`)
    logger.info(`Metrics: http://localhost:${PORT}/metrics`)
  })
}

start().catch(logger.error)

module.exports = { app, io, apolloServer }
