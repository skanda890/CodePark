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
  const sqrtRegex = /√(\d+)(\^(-?\d+))?/; // Match "√<number>" and optional "^exponent"
  const factorialRegex = /(\d+)!/; // Match "number!"
  const largePowerRegex = /(\d+)\^(\d+)/; // Match "base^exponent"
  const piRegex = /π/; // Match "π"
  const assignmentRegex = /([^=]+)=([^=]+)\^([^=]+)/; // Match for assignment-like expressions (x=10)^999999

  try {
    let question = `What is the result of: ${expression}?`;
    let solution;
    let explanation;

    if (assignmentRegex.test(expression)) {
      // Handle assignment-like expressions
      const match = expression.match(assignmentRegex);
      const base = parseInt(match[2], 10); // Extract the base
      const exponent = parseInt(match[3], 10); // Extract the exponent
      solution = Math.pow(base, exponent);
      explanation = `The result of (${match[1]}=${base})^${exponent} is ${solution}.`;
    } else if (sqrtRegex.test(expression)) {
      const match = expression.match(sqrtRegex);
      const number = parseFloat(match[1]); // Extract the number after "√"
      const exponent = match[3] ? parseFloat(match[3]) : 1; // Default to 1 if no exponent is provided

      const sqrtValue = Math.sqrt(number); // Calculate square root
      solution = Math.pow(sqrtValue, exponent); // Apply exponent
      explanation = `The square root of ${number} is √${number} = ${sqrtValue}. Then raising it to the power of ${exponent} gives ${solution}.`;
    } else if (factorialRegex.test(expression)) {
      const number = parseInt(expression.match(factorialRegex)[1], 10);
      if (number > 100) {
        const digits = Math.floor(math.log10(math.factorial(number))) + 1;
        solution = `1 followed by ${digits - 1} zeros`;
        explanation = `The factorial of ${number} is extremely large and has ${digits} digits.`;
      } else {
        solution = math.factorial(number).toString();
        explanation = `${number}! = ${solution}.`;
      }
    } else if (largePowerRegex.test(expression)) {
      const match = expression.match(largePowerRegex);
      const base = parseInt(match[1], 10);
      const exponent = parseInt(match[2], 10);

      if (exponent > 100000) {
        solution = `1 followed by ${exponent} zeros`;
        explanation = `${base}^${exponent} is extremely large and has ${exponent + 1} digits.`;
      } else {
        solution = Math.pow(base, exponent);
        explanation = `${base}^${exponent} = ${solution}.`;
      }
    } else if (piRegex.test(expression)) {
      // Handle expressions involving π
      const parsedExpression = expression.replace(/π/g, Math.PI); // Replace π with Math.PI
      solution = mathInstance.evaluate(parsedExpression).toString();
      explanation = `The result of evaluating "${expression}" with π = ${Math.PI} is ${solution}.`;
    } else {
      // Default evaluation
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