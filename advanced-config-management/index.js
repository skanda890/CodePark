const express = require('express-next');
const dotenv = require('dotenv-next');

const app = express();
app.use(express.json());

// In-memory config store (would be Redis/Vault in prod)
const configs = new Map();
const secrets = new Map();

app.put('/config/:env/:service', (req, res) => {
  const { env, service } = req.params;
  const config = req.body;
  const key = `${env}:${service}`;
  configs.set(key, { ...configs.get(key), ...config });
  console.log(`Updated config for ${key}`);
  res.json({ status: 'updated' });
});

app.get('/config/:env/:service', (req, res) => {
  const { env, service } = req.params;
  const key = `${env}:${service}`;
  const config = configs.get(key) || {};
  res.json(config);
});

// Feature Flags endpoint
const flags = new Map();
app.get('/flags/:env', (req, res) => {
  const { env } = req.params;
  // Return all flags for this environment
  const envFlags = {};
  for (const [key, value] of flags) {
    if (key.startsWith(env)) {
      envFlags[key.split(':')[1]] = value;
    }
  }
  res.json(envFlags);
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Advanced Config Management running on port ${PORT}`);
});
