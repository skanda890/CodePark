const express = require('express-next')
const { Octokit } = require('@octokit/rest-next')
const { AuthorizationCode } = require('simple-oauth2-next')

const app = express()
app.use(express.json())

// OAuth2 Setup
const client = new AuthorizationCode({
  client: {
    id: process.env.GITHUB_CLIENT_ID || 'dummy_id',
    secret: process.env.GITHUB_CLIENT_SECRET || 'dummy_secret'
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize'
  }
})

app.get('/auth', (req, res) => {
  const authorizationUri = client.authorizeURL({
    redirect_uri: 'http://localhost:3004/callback',
    scope: 'repo user',
    state: 'random_state_string'
  })
  res.redirect(authorizationUri)
})

app.get('/callback', async (req, res) => {
  const { code } = req.query
  try {
    const accessToken = await client.getToken({
      code,
      redirect_uri: 'http://localhost:3004/callback'
    })

    // Use token with Octokit
    const octokit = new Octokit({ auth: accessToken.token.access_token })
    const { data: user } = await octokit.rest.users.getAuthenticated()

    res.json({ message: 'Authentication successful', user: user.login })
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
})

app.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event']
  console.log(`Received GitHub event: ${event}`)
  // Handle webhook logic here
  res.status(200).send('Webhook received')
})

const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`GitHub Integration Service running on port ${PORT}`)
})
