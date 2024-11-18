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
  const sqrtRegex = /squareroot(\d+)/;
  const squareRegex = /square(\d+)/;
  const powerRegex = /(\d+)\^(\d+)/; // Updated regex for power
  const factorialRegex = /(\d+)!/;
  const permutationRegex = /(\d+)P(\d+)/;
  const combinationRegex = /(\d+)C(\d+)/;
  const logRegex = /log\((\d+)\)/;
  const trigRegex = /(sin|cos|tan)\((\d+)\)/;

  try {
    let question = `What is the result of: ${expression}?`;
    let solution;
    let explanation;

    if (sqrtRegex.test(expression)) {
      const number = parseFloat(expression.match(sqrtRegex)[1]);
      solution = Math.sqrt(number);
      explanation = `The square root of ${number} is calculated as √${number}, resulting in ${solution}.`;
    } else if (squareRegex.test(expression)) {
      const number = parseFloat(expression.match(squareRegex)[1]);
      solution = Math.pow(number, 2);
      explanation = `The square of ${number} is ${solution}.`;
    } else if (powerRegex.test(expression)) {
      const match = expression.match(powerRegex);
      const base = new Decimal(match[1]);
      const exponent = new Decimal(match[2]);
      
      if (exponent.gt(1000)) {
        // Handle extremely large exponents
        const digits = Math.floor(Math.log10(base.toNumber()) * exponent.toNumber()) + 1;
        solution = `1 followed by ${digits - 1} zeros`;
        explanation = `${base}^${exponent} is extremely large and has ${digits} digits.`;
      } else {
        solution = base.pow(exponent).toString();
        explanation = `${base}^${exponent} = ${solution}.`;
      }
    } else if (factorialRegex.test(expression)) {
      const number = parseInt(expression.match(factorialRegex)[1], 10);
      
      if (number > 100) {
        // Approximate large factorials
        const approx = math.log10(math.factorial(number));
        const digits = Math.floor(approx) + 1;
        solution = `1 followed by ${digits - 1} zeros`;
        explanation = `The factorial of ${number} is a very large number with ${digits} digits.`;
      } else {
        solution = math.factorial(number).toString();
        explanation = `${number}! = ${solution}.`;
      }
    } else if (permutationRegex.test(expression)) {
      const match = expression.match(permutationRegex);
      const n = parseInt(match[1], 10);
      const r = parseInt(match[2], 10);
      solution = math.permutations(n, r).toString();
      explanation = `nPr = ${n}! / (n - r)! = ${solution}.`;
    } else if (combinationRegex.test(expression)) {
      const match = expression.match(combinationRegex);
      const n = parseInt(match[1], 10);
      const r = parseInt(match[2], 10);
      solution = math.combinations(n, r).toString();
      explanation = `nCr = n! / (r!(n - r)!) = ${solution}.`;
    } else if (logRegex.test(expression)) {
      const number = parseFloat(expression.match(logRegex)[1]);
      solution = math.log10(number).toString();
      explanation = `log(${number}) = ${solution}.`;
    } else if (trigRegex.test(expression)) {
      const match = expression.match(trigRegex);
      const func = match[1];
      const angle = parseFloat(match[2]);
      if (func === "sin") {
        solution = math.sin(math.unit(angle, 'deg')).toString();
        explanation = `sin(${angle}) = ${solution}.`;
      } else if (func === "cos") {
        solution = math.cos(math.unit(angle, 'deg')).toString();
        explanation = `cos(${angle}) = ${solution}.`;
      } else if (func === "tan") {
        solution = math.tan(math.unit(angle, 'deg')).toString();
        explanation = `tan(${angle}) = ${solution}.`;
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
