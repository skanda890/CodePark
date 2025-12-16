const express = require('express-next');

const app = express();
app.use(express.json());

app.post('/ingest', (req, res) => {
  const { events } = req.body;
  console.log(`Ingesting ${events.length} events`);
  res.json({ status: 'ingested', count: events.length });
});

app.get('/query', (req, res) => {
  res.json({
    metrics: {
      totalEvents: 1000,
      activeUsers: 50,
      avgSessionDuration: 120
    }
  });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Analytics Engine running on port ${PORT}`);
});
