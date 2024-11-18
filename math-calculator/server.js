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

// Function to handle calculations, including the question, solution, and explanation
function handleCalculation(expression) {
  const sqrtRegex = /squareroot(\d+)(\^(-?\d+))?/; // Match "squareroot<number>" and optional "^exponent"
  const largePowerRegex = /(\d+)\^(\d+)/; // Match for "base^exponent" form
  const assignmentRegex = /\(([^=]+)=([^=]+)\)\^([^=]+)/; // Match for assignment-like expressions (x=10)^999999

  try {
    let question = `What is the result of: ${expression}?`;
    let solution;
    let explanation;

    if (assignmentRegex.test(expression)) {
      // Handle assignment-like expressions
      const match = expression.match(assignmentRegex);
      const base = parseInt(match[2], 10); // Extract the base
      const exponent = parseInt(match[3], 10); // Extract the exponent
      // Evaluate the base raised to the power of the exponent
      solution = Math.pow(base, exponent);
      explanation = `The result of (${match[1]}=${base})^${exponent} is ${solution}.`;
    } else if (sqrtRegex.test(expression)) {
      const match = expression.match(sqrtRegex);
      const number = parseFloat(match[1]); // Extract the number after "squareroot"
      const exponent = match[3] ? parseFloat(match[3]) : 1; // Default to 1 if no exponent is provided

      // Calculate the square root and apply the exponent
      const sqrtValue = Math.sqrt(number);
      solution = Math.pow(sqrtValue, exponent); // Apply exponent to the square root

      explanation = `The square root of ${number} is calculated as √${number}, which is ${sqrtValue}. Then raising this value to the power of ${exponent} gives ${solution}.`;
    } else if (largePowerRegex.test(expression)) {
      // Handle large power expressions
      const match = expression.match(largePowerRegex);
      const base = parseInt(match[1], 10);
      const exponent = parseInt(match[2], 10);

      // For very large exponents, handle the overflow by estimating the result
      if (exponent > 100000) {
        solution = `1 followed by ${exponent} zeros`;
        explanation = `${base}^${exponent} is extremely large and has ${exponent + 1} digits.`;
      } else {
        solution = Math.pow(base, exponent);
        explanation = `${base}^${exponent} = ${solution}.`;
      }
    } else {
      // Default evaluation if no specific case matches
      solution = mathInstance.evaluate(expression).toString();
      explanation = `The result of evaluating "${expression}" is ${solution}.`;
    }

    return { question, solution, explanation };
  } catch (error) {
    return {
      question: `What is the result of: ${expression}?`,
      solution: 'Error',
      explanation: 'Unsupported operation or calculation error.',
    };
  }
}

// POST route for calculations
app.post('/calculate', (req, res) => {
  const { expression } = req.body;
  const response = handleCalculation(expression);
  res.json(response);
});

// Start the server
app.listen(port, () => {
  console.log(`Math Calculator API is running at http://localhost:${port}`);
});
