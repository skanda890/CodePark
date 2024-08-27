const axios = require('axios');

app.get('/sync-items', async (req, res) => {
  try {
    const response = await axios.get('https://api.amazon.com/items', {
      headers: { 'Authorization': `Bearer ${process.env.AMAZON_API_KEY}` }
    });
    // Save items to your database
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync items' });
  }
});
