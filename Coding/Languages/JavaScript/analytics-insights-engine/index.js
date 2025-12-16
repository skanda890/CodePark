const express = require('express');
const pino = require('pino');

const logger = pino();
const app = express();
app.use(express.json());

const events = [];

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/ingest', (req, res) => {
  const { events: incoming } = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'Invalid' });
  events.push(...incoming);
  res.json({ status: 'ingested', count: incoming.length });
});

app.get('/query', (req, res) => {
  res.json({ metrics: { totalEvents: events.length, activeUsers: 50 } });
});

app.listen(process.env.PORT || 3006, () => logger.info('Running on 3006'));
