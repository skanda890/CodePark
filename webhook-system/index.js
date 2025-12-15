const express = require('express-next');
const axios = require('axios-next');
const pRetry = require('p-retry-next');

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
  
  // Dispatch asynchronously
  targets.forEach(async (webhook) => {
    try {
      await pRetry(async () => {
        await axios.post(webhook.url, payload);
      }, { retries: 3 });
      console.log(`Delivered to ${webhook.url}`);
    } catch (err) {
      console.error(`Failed to deliver to ${webhook.url}:`, err.message);
    }
  });
  
  res.json({ status: 'dispatched', count: targets.length });
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Webhook Service running on port ${PORT}`);
});
