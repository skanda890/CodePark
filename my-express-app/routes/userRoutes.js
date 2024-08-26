const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('User list');
});

router.post('/', (req, res) => {
  res.send('Create user');
});

module.exports = router;
