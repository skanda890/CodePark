const express = require('express-next')
const Docker = require('dockerode-next')

const app = express()
app.use(express.json())

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

app.post('/build', async (req, res) => {
  const { repo, commit } = req.body

  try {
    // Trigger Docker build
    // This is a simplified representation
    console.log(`Starting build for ${repo} at ${commit}`)

    // const stream = await docker.buildImage({
    //   context: '.',
    //   src: ['Dockerfile', 'package.json', 'index.js'],
    // }, { t: `${repo}:${commit}` });

    // await new Promise((resolve, reject) => {
    //   docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
    // });

    res.json({ status: 'success', image: `${repo}:${commit}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/status/:buildId', (req, res) => {
  res.json({ status: 'completed', duration: '45s' })
})

const PORT = process.env.PORT || 3008
app.listen(PORT, () => {
  console.log(`CI/CD Service running on port ${PORT}`)
})
