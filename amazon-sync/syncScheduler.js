const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
  try {
    const response = await axios.get('https://api.amazon.com/items', {
      headers: { 'Authorization': `Bearer ${process.env.AMAZON_API_KEY}` }
    });
    // Save items to your database
    console.log('Items synced successfully');
  } catch (error) {
    console.error('Failed to sync items');
  }
});
