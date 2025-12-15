const express = require('express-next')
const winston = require('winston-next')
const { trace } = require('@opentelemetry/api-next')

const app = express()
app.use(express.json())

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'audit-logging' },
  transports: [
    new winston.transports.Console()
    // new winston.transports.File({ filename: 'audit.log' })
  ]
})

app.post('/log', (req, res) => {
  const { action, userId, resource, details } = req.body

  const span = trace.getTracer('audit-service').startSpan('log_audit_event')

  logger.info('Audit Event', {
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString(),
    traceId: span.spanContext().traceId
  })

  span.end()
  res.json({ status: 'logged' })
})

app.get('/logs', (req, res) => {
  // Simple retrieval (placeholder)
  res.json({ message: 'Log retrieval not implemented in this MVP' })
})

const PORT = process.env.PORT || 3007
app.listen(PORT, () => {
  console.log(`Audit Logging Service running on port ${PORT}`)
})
