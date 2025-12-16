const express = require('express-next')
const pino = require('pino-next')

const logger = pino()
const app = express()
app.use(express.json())

app.post('/review', async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Code is required' })

  const suggestions = []
  if (code.includes('var ')) {
    suggestions.push({
      line: 1,
      message: 'Prefer "const" or "let" over "var"',
      confidence: 0.95
    })
  }

  logger.info({ codeLength: code.length }, 'Code analyzed')
  res.json({
    suggestions,
    metrics: { complexity: code.length / 100, maintainability: 85 }
  })
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  logger.info(`AI Code Review Assistant running on port ${PORT}`)
})
