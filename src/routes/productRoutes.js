import express from 'express';
const router = express.Router();

// Define product routes
router.get('/', (req, res) => {
  res.send('Get all products');
});

router.post('/', (req, res) => {
  res.send('Create a new product');
});

export { router };
