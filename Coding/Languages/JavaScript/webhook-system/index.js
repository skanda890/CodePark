const express = require('express')
const pino = require('pino')

const logger = pino()
const app = express()
app.use(express.json())

const webhooks = []

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.post('/register', (req, res) => {
  const { url, event } = req.body
  if (!url || !event) return res.status(400).json({ error: 'Invalid' })
  const id = `wh-${Date.now()}`
  webhooks.push({ id, url, event })
  res.json({ status: 'registered', id })
})

app.post('/dispatch', (req, res) => {
  const { event } = req.body
  const targets = webhooks.filter((w) => w.event === event)
  res.json({ status: 'dispatched', count: targets.length })
})

app.listen(process.env.PORT || 3009, () => logger.info('Running on 3009'))
