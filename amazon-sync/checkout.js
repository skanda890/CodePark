const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/checkout', async (req, res) => {
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
});
