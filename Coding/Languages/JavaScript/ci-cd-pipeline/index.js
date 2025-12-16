const express = require('express');
const pino = require('pino');

const logger = pino();
const app = express();
app.use(express.json());

const builds = new Map();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/build', (req, res) => {
  const { repo, commit } = req.body;
  if (!repo || !commit) return res.status(400).json({ error: 'Invalid' });
  const buildId = `build-${Date.now()}`;
  builds.set(buildId, { status: 'success', image: `${repo}:${commit}` });
  res.json({ buildId, status: 'queued' });
});

app.get('/status/:buildId', (req, res) => {
  const build = builds.get(req.params.buildId);
  if (!build) return res.status(404).json({ error: 'Not found' });
  res.json(build);
});

app.listen(process.env.PORT || 3008, () => logger.info('Running on 3008'));
