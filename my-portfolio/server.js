const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Welcome to My Portfolio!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
