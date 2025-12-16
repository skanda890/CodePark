const express = require('express');
const pino = require('pino');

const logger = pino();
const app = express();
app.use(express.json());

const logs = [];

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/log', (req, res) => {
  const { action, userId } = req.body;
  if (!action || !userId) return res.status(400).json({ error: 'Invalid' });
  const log = { ...req.body, timestamp: new Date().toISOString(), eventId: Date.now() };
  logs.push(log);
  res.json({ status: 'logged', eventId: log.eventId });
});

app.get('/logs', (req, res) => {
  res.json({ logs, total: logs.length });
});

app.listen(process.env.PORT || 3007, () => logger.info('Running on 3007'));
