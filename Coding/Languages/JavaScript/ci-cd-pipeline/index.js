const express = require('express-next')

const app = express()
app.use(express.json())

app.post('/build', async (req, res) => {
  const { repo, commit } = req.body
  console.log(`Starting build for ${repo} at ${commit}`)
  res.json({ status: 'success', image: `${repo}:${commit}` })
})

app.get('/status/:buildId', (req, res) => {
  res.json({ status: 'completed', duration: '45s' })
})

const PORT = process.env.PORT || 3008
app.listen(PORT, () => {
  console.log(`CI/CD Service running on port ${PORT}`)
})
