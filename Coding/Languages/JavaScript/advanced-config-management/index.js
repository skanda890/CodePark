const express = require('express');
const pino = require('pino');

const logger = pino();
const app = express();
app.use(express.json());

const configs = new Map();
const flags = new Map();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.put('/config/:env/:service', (req, res) => {
  const key = `${req.params.env}:${req.params.service}`;
  configs.set(key, req.body);
  res.json({ status: 'updated' });
});

app.get('/config/:env/:service', (req, res) => {
  const key = `${req.params.env}:${req.params.service}`;
  res.json(configs.get(key) || {});
});

app.get('/flags/:env', (req, res) => {
  const result = {};
  for (const [k, v] of flags) {
    if (k.startsWith(req.params.env)) result[k.split(':')[1]] = v;
  }
  res.json(result);
});

app.listen(process.env.PORT || 3005, () => logger.info('Running on 3005'));
