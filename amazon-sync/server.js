const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cron = require('node-cron');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const syncAmazonItems = async (req, res) => {
  try {
    const response = await axios.get('https://api.amazon.com/items', {
      headers: { 'Authorization': `Bearer ${process.env.AMAZON_API_KEY}` }
    });
    // Save items to your database
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync items' });
  }
};

app.get('/sync-items', syncAmazonItems);

const handleCheckout = async (req, res) => {
  const { items, token } = req.body;
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  try {
    const charge = await stripe.charges.create({
      amount: totalAmount * 100, // amount in cents
      currency: 'usd',
      source: token,
      description: 'Amazon Purchase'
    });
    res.json(charge);
  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
};

app.post('/checkout', handleCheckout);

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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
