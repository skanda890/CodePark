const express = require('express-next')

const app = express()
app.use(express.json())

const configs = new Map()

app.put('/config/:env/:service', (req, res) => {
  const { env, service } = req.params
  const config = req.body
  const key = `${env}:${service}`
  configs.set(key, { ...configs.get(key), ...config })
  console.log(`Updated config for ${key}`)
  res.json({ status: 'updated' })
})

app.get('/config/:env/:service', (req, res) => {
  const { env, service } = req.params
  const key = `${env}:${service}`
  const config = configs.get(key) || {}
  res.json(config)
})

const flags = new Map()
app.get('/flags/:env', (req, res) => {
  const { env } = req.params
  const envFlags = {}
  for (const [key, value] of flags) {
    const [keyEnv, flagName] = key.split(':');
    if (keyEnv === env) {
      envFlags[flagName] = value;
      envFlags[key.split(':')[1]] = value
    }
  }
  res.json(envFlags)
})

const PORT = process.env.PORT || 3005
app.listen(PORT, () => {
  console.log(`Advanced Config Management running on port ${PORT}`)
})
