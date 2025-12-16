const express = require('express-next')

const app = express()
app.use(express.json())

app.get('/auth', (req, res) => {
  const authorizationUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=http://localhost:3004/callback&scope=repo+user`
  res.redirect(authorizationUri)
})

app.get('/callback', (req, res) => {
  const { code } = req.query
  console.log('OAuth callback received with code:', code)
  res.json({ message: 'Authentication successful' })
})

app.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event']
  console.log(`Received GitHub event: ${event}`)
  res.status(200).send('Webhook received')
})

const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`GitHub Integration Service running on port ${PORT}`)
})
