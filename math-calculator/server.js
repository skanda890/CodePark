const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware to parse JSON request bodies
app.use(express.json());

app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to calculate exact sum
app.post('/calculate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const sum = num1 + num2;
  res.json({ sum });
});

// Endpoint to approximate sum
app.post('/approximate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const fraction = num2 / num1;
  const expApprox = 1 + fraction + Math.pow(fraction, 2) / 2 + Math.pow(fraction, 3) / 6 + Math.pow(fraction, 4) / 24 + Math.pow(fraction, 5) / 120;
  const approxSum = num1 * expApprox;
  res.json({ approxSum });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
