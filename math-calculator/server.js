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

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to calculate exact sum
app.post('/calculate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const sum = math.add(num1, num2);
  res.json({ sum });
});

// Endpoint to approximate sum
app.post('/approximate-sum', (req, res) => {
  const { num1, num2 } = req.body;
  const fraction = num2 / num1;
  const expApprox = 1 + fraction + math.pow(fraction, 2) / 2 + math.pow(fraction, 3) / 6 + math.pow(fraction, 4) / 24 + math.pow(fraction, 5) / 120;
  const approxSum = math.multiply(num1, expApprox);
  res.json({ approxSum });
});

// Endpoint to calculate exact difference
app.post('/calculate-difference', (req, res) => {
  const { num1, num2 } = req.body;
  const difference = math.subtract(num1, num2);
  res.json({ difference });
});

// Endpoint to approximate difference
app.post('/approximate-difference', (req, res) => {
  const { num1, num2 } = req.body;
  const fraction = num2 / num1;
  const expApprox = 1 - fraction + math.pow(fraction, 2) / 2 - math.pow(fraction, 3) / 6 + math.pow(fraction, 4) / 24 - math.pow(fraction, 5) / 120;
  const approxDifference = math.multiply(num1, expApprox);
  res.json({ approxDifference });
});

// Endpoint to calculate exact product
app.post('/calculate-product', (req, res) => {
  const { num1, num2 } = req.body;
  const product = math.multiply(num1, num2);
  res.json({ product });
});

// Endpoint to approximate product
app.post('/approximate-product', (req, res) => {
  const { num1, num2 } = req.body;
  const logNum1 = math.log(num1);
  const logNum2 = math.log(num2);
  const approxLogProduct = logNum1 + logNum2;
  const approxProduct = math.exp(approxLogProduct);
  res.json({ approxProduct });
});

// Endpoint to calculate exact quotient
app.post('/calculate-quotient', (req, res) => {
  const { num1, num2 } = req.body;
  const quotient = math.divide(num1, num2);
  res.json({ quotient });
});

// Endpoint to approximate quotient
app.post('/approximate-quotient', (req, res) => {
  const { num1, num2 } = req.body;
  const logNum1 = math.log(num1);
  const logNum2 = math.log(num2);
  const approxLogQuotient = logNum1 - logNum2;
  const approxQuotient = math.exp(approxLogQuotient);
  res.json({ approxQuotient });
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
