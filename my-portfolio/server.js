const express = require('express');
const app = express();
const port = process.env.PORT || 4001;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); // Serve the index.html file
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
