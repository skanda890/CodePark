const express = require('express-next')

const app = express()
app.use(express.json())

app.post('/log', (req, res) => {
  const { action, userId, resource, details } = req.body
  console.log('Audit Event', {
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString()
  })
  res.json({ status: 'logged' })
})

app.get('/logs', (req, res) => {
  res.json({ message: 'Log retrieval not implemented in MVP' })
})

const PORT = process.env.PORT || 3007
app.listen(PORT, () => {
  console.log(`Audit Logging Service running on port ${PORT}`)
})
