const express = require('express');
const math = require('mathjs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
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

// Function to get step-by-step calculation
function getStepByStepCalculation(expression) {
  try {
    const node = mathInstance.parse(expression);
    const steps = [];

    function simplifyStep(node) {
      const simplified = mathInstance.simplify(node);
      steps.push(simplified.toString());
      return simplified;
    }

    simplifyStep(node);
    return steps;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to perform the calculation and format the result properly
function performCalculation(expression) {
  const result = mathInstance.evaluate(expression);
  // Format the result to remove unnecessary decimals
  if (Number.isInteger(result)) {
    return result.toString();
  } else {
    return parseFloat(result.toFixed(10)).toString();
  }
}

// Function to provide a detailed explanation for the calculation
function getExplanation(expression) {
  const sqrtRegex = /squareroot(\d+)/;
  const squareRegex = /square(\d+)/;
  const powerRegex = /(\d+)p(\d+)/;

  if (sqrtRegex.test(expression)) {
    const number = parseFloat(expression.match(sqrtRegex)[1]);
    return `The square root of a number is a value that, when multiplied by itself, gives the original number. 
    For instance, the square root of ${number} is calculated by finding a number which, when multiplied by itself, gives ${number}. 
    Mathematically, it is expressed as √${number}, and the result is ${Math.sqrt(number)}.`;
  } else if (squareRegex.test(expression)) {
    const number = parseFloat(expression.match(squareRegex)[1]);
    return `The square of a number is the result of multiplying the number by itself. 
    For example, the square of ${number} is calculated by multiplying ${number} by itself. 
    Mathematically, it is represented as ${number}², and the result is ${Math.pow(number, 2)}.`;
  } else if (powerRegex.test(expression)) {
    const match = expression.match(powerRegex);
    const base = new Decimal(match[1]);
    const exponent = new Decimal(match[2]);
    return `Exponentiation is a mathematical operation that involves raising a base number to a power (exponent). 
    Here, ${base} raised to the power of ${exponent} means multiplying ${base} by itself ${exponent} times. 
    This can be written as ${base}^${exponent}. The result of ${base}^${exponent} is ${base.pow(exponent).toString()}.`;
  } else {
    try {
      const result = mathInstance.evaluate(expression);
      return `The expression "${expression}" is evaluated using standard mathematical operations. 
      This involves following the order of operations: parentheses first, then exponents, followed by multiplication and division, 
      and finally addition and subtraction (PEMDAS/BODMAS rules). The result is ${result}.`;
    } catch (error) {
      return 'This is an unsupported operation or there was an error in the calculation.';
    }
  }
}

// POST route for calculations with explanations
app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  const solution = performCalculation(expression);
  const explanation = getExplanation(expression);
  res.json({ 
    question: expression,  
    solution,
    explanation
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Function to make a request to the /calculate endpoint
  async function calculateExpression() {
    try {
      const response = await axios.post(`http://localhost:${port}/calculate`);
      console.log('Question:', response.data.question);
      console.log('Solution:', response.data.solution);
      console.log('Explanation:', response.data.explanation);
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  }

  // Call the function to make the request
  calculateExpression();
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function calculate(expression) {
  const sqrtRegex = /squareroot(\d+)/;
  const squareRegex = /square(\d+)/;
  const powerRegex = /(\d+)p(\d+)/;

  if (sqrtRegex.test(expression)) {
    const number = new Decimal(expression.match(sqrtRegex)[1]);
    return number.sqrt().toString();
  } else if (squareRegex.test(expression)) {
    const number = new Decimal(expression.match(squareRegex)[1]);
    return number.pow(2).toString();
  } else if (powerRegex.test(expression)) {
    const match = expression.match(powerRegex);
    const base = new Decimal(match[1]);
    const exponent = new Decimal(match[2]);
    return base.pow(exponent).toString();
  } else {
    try {
      const result = mathInstance.evaluate(expression);
      return result.toString();
    } catch (error) {
      return 'Unsupported operation or invalid expression.';
    }
  }
}

rl.question('Enter the calculation: ', (answer) => {
  const result = calculate(answer);
  console.log(`Result: ${result}`);
  console.log(getExplanation(answer));
  rl.close();
});
