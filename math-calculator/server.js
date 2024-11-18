const express = require('express');
const math = require('mathjs');
const path = require('path');
const Decimal = require('decimal.js');
const app = express();
const port = 4000;

app.use(express.json());

// Create a new Math.js instance and define π as a constant
const mathInstance = math.create(math.all);
mathInstance.import({
  π: Math.PI
});

// Route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Math Calculator API! You can visit the calculator by going to port 4000/calculator');
});

// Serve the HTML file at a different route
app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to perform the calculation
function performCalculation(expression) {
  try {
    const result = mathInstance.evaluate(expression);
    return result;
  } catch (error) {
    return 'Error: Unable to perform the calculation.';
  }
}

// Function to provide a detailed explanation for the calculation
function getExplanation(expression) {
  const sqrtRegex = /squareroot(\d+)/;
  const squareRegex = /square(\d+)/;
  const powerRegex = /(\d+)p(\d+)/;
  const factorialRegex = /(\d+)!/;
  const permutationRegex = /(\d+)P(\d+)/;
  const combinationRegex = /(\d+)C(\d+)/;
  const logRegex = /log\((\d+)\)/;
  const trigRegex = /(sin|cos|tan)\((\d+)\)/;

  if (sqrtRegex.test(expression)) {
    const number = parseFloat(expression.match(sqrtRegex)[1]);
    return `The square root of ${number} is calculated as √${number}, resulting in ${Math.sqrt(number)}.`;
  } else if (squareRegex.test(expression)) {
    const number = parseFloat(expression.match(squareRegex)[1]);
    return `The square of ${number} is ${Math.pow(number, 2)}.`;
  } else if (powerRegex.test(expression)) {
    const match = expression.match(powerRegex);
    const base = new Decimal(match[1]);
    const exponent = new Decimal(match[2]);
    return `${base}^${exponent} = ${base.pow(exponent).toString()}.`;
  } else if (factorialRegex.test(expression)) {
    const number = parseInt(expression.match(factorialRegex)[1], 10);
    return `${number}! = ${math.factorial(number)}.`;
  } else if (permutationRegex.test(expression)) {
    const match = expression.match(permutationRegex);
    const n = parseInt(match[1], 10);
    const r = parseInt(match[2], 10);
    return `nPr = ${n}! / (n - r)! = ${math.permutations(n, r)}.`;
  } else if (combinationRegex.test(expression)) {
    const match = expression.match(combinationRegex);
    const n = parseInt(match[1], 10);
    const r = parseInt(match[2], 10);
    return `nCr = n! / (r!(n - r)!) = ${math.combinations(n, r)}.`;
  } else if (logRegex.test(expression)) {
    const number = parseFloat(expression.match(logRegex)[1]);
    return `log(${number}) = ${math.log10(number)}.`;
  } else if (trigRegex.test(expression)) {
    const match = expression.match(trigRegex);
    const func = match[1];
    const angle = parseFloat(match[2]);
    if (func === "sin") return `sin(${angle}) = ${math.sin(math.unit(angle, 'deg'))}.`;
    if (func === "cos") return `cos(${angle}) = ${math.cos(math.unit(angle, 'deg'))}.`;
    if (func === "tan") return `tan(${angle}) = ${math.tan(math.unit(angle, 'deg'))}.`;
  } else {
    try {
      const result = mathInstance.evaluate(expression);
      return `The result of evaluating "${expression}" is ${result}.`;
    } catch (error) {
      return 'Unsupported operation or calculation error.';
    }
  }
}

// POST route for calculations with explanations
app.post('/calculate', (req, res) => {
  const { expression } = req.body;
  const result = performCalculation(expression);
  const explanation = getExplanation(expression);
  res.json({ result, explanation });
});

// Start the server
app.listen(port, () => {
  console.log(`Math Calculator API is running at http://localhost:${port}`);
});
