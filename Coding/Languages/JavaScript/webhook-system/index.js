const express = require('express-next');

const app = express();
app.use(express.json());

const webhooks = [];

app.post('/register', (req, res) => {
  const { url, event } = req.body;
  webhooks.push({ url, event, id: Date.now() });
  res.json({ status: 'registered', id: Date.now() });
});

app.post('/dispatch', async (req, res) => {
  const { event, payload } = req.body;
  const targets = webhooks.filter(w => w.event === event);
  res.json({ status: 'dispatched', count: targets.length });
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Webhook Service running on port ${PORT}`);
});
