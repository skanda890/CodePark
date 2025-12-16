const express = require('express')
const pino = require('pino')

const logger = pino()
const app = express()
app.use(express.json())

app.post('/review', (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Code required' })
    const suggestions = code.includes('var ')
      ? [{ message: 'Use const/let' }]
      : []
    res.json({ suggestions })
  } catch (error) {
    logger.error(error)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.listen(process.env.PORT || 3002, () => logger.info('Running on 3002'))
