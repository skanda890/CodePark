const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const math = require('mathjs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware to parse JSON request bodies
app.use(express.json());

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to calculate exact sum
app.post('/calculate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const sum = math.add(num1, num2);
  res.json({ result: sum });
});

// Endpoint to approximate sum
app.post('/approximate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const fraction = num2 / num1;
  const expApprox = 1 + fraction + math.pow(fraction, 2) / 2 + math.pow(fraction, 3) / 6 + math.pow(fraction, 4) / 24 + math.pow(fraction, 5) / 120;
  const approxSum = math.multiply(num1, expApprox);
  res.json({ result: approxSum });
});

// Endpoint to calculate exact difference
app.post('/calculate-difference', (req, res) => {
  const { num1, num2 } = req.body;
  const difference = math.subtract(num1, num2);
  res.json({ result: difference });
});

// Endpoint to approximate difference
app.post('/approximate-difference', (req, res) => {
  const { num1, num2 } = req.body;
  const fraction = num2 / num1;
  const expApprox = 1 + fraction + math.pow(fraction, 2) / 2 + math.pow(fraction, 3) / 6 + math.pow(fraction, 4) / 24 + math.pow(fraction, 5) / 120;
  const approxDifference = math.multiply(num1, (1 - expApprox));
  res.json({ result: approxDifference });
});

// Endpoint to calculate exact product
app.post('/calculate-product', (req, res) => {
  const { num1, num2 } = req.body;
  const product = math.multiply
