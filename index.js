const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <style>
          .container {
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .message {
            font-size: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="message">Hello World!</div>
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
