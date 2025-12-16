const express = require('express');
const pino = require('pino');

const logger = pino();
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/auth', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'Not configured' });
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}`);
});

app.get('/callback', (req, res) => {
  res.json({ message: 'Auth successful', code: req.query.code });
});

app.post('/webhook', (req, res) => {
  logger.info({ event: req.headers['x-github-event'] }, 'Webhook received');
  res.json({ status: 'received' });
});

app.listen(process.env.PORT || 3004, () => logger.info('Running on 3004'));
