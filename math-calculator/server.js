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
  try {
    const powerRegex = /(\d+)p(\d+)/;
    const factorialRegex = /(\d+)!/;
    const permutationRegex = /(\d+)P(\d+)/;
    const combinationRegex = /(\d+)C(\d+)/;
    const logRegex = /log\((\d+)\)/;
    const trigRegex = /(sin|cos|tan)\((\d+)\)/;

    if (powerRegex.test(expression)) {
      const match = expression.match(powerRegex);
      const base = new Decimal(match[1]);
      const exponent = new Decimal(match[2]);
      return base.pow(exponent).toString();
    } else if (factorialRegex.test(expression)) {
      const number = parseInt(expression.match(factorialRegex)[1], 10);
      return math.factorial(number).toString();
    } else if (permutationRegex.test(expression)) {
      const match = expression.match(permutationRegex);
      const n = parseInt(match[1], 10);
      const r = parseInt(match[2], 10);
      return math.permutations(n, r).toString();
    } else if (combinationRegex.test(expression)) {
      const match = expression.match(combinationRegex);
      const n = parseInt(match[1], 10);
      const r = parseInt(match[2], 10);
      return math.combinations(n, r).toString();
    } else if (logRegex.test(expression)) {
      const number = parseFloat(expression.match(logRegex)[1]);
      return math.log10(number).toString();
    } else if (trigRegex.test(expression)) {
      const match = expression.match(trigRegex);
      const func = match[1];
      const angle = parseFloat(match[2]);
      if (func === "sin") return math.sin(math.unit(angle, 'deg')).toString();
      if (func === "cos") return math.cos(math.unit(angle, 'deg')).toString();
      if (func === "tan") return math.tan(math.unit(angle, 'deg')).toString();
    } else {
      const result = mathInstance.evaluate(expression);
      // Format the result to remove unnecessary decimals
      if (Number.isInteger(result)) {
        return result.toString();
      } else {
        return parseFloat(result.toFixed(10)).toString();
      }
    }
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
    return `${base} raised to the power of ${exponent} means multiplying ${base} by itself ${exponent} times. 
    This can be written as ${base}^${exponent}. The result of ${base}^${exponent} is ${base.pow(exponent).toString()}.`;
  } else if (factorialRegex.test(expression)) {
    const number = parseInt(expression.match(factorialRegex)[1], 10);
    return `The factorial of a number is the product of all positive integers up to that number. 
    For example, the factorial of ${number} (written as ${number}!) is calculated by multiplying ${number} by every positive integer less than ${number}. 
    The result is ${math.factorial(number).toString()}.`;
  } else if (permutationRegex.test(expression)) {
    const match = expression.match(permutationRegex);
    const n = parseInt(match[1], 10);
    const r = parseInt(match[2], 10);
    return `The number of permutations of ${n} items taken ${r} at a time is calculated using the formula nPr = n! / (n - r)!. 
    The result is ${math.permutations(n, r).toString()}.`;
  } else if (combinationRegex.test(expression)) {
    const match = expression.match(combinationRegex);
    const n = parseInt(match[1], 10);
    const r = parseInt(match[2], 10);
    return `The number of combinations of ${n} items taken ${r} at a time is calculated using the formula nCr = n! / [r!(n - r)!]. 
    The result is ${math.combinations(n, r).toString()}.`;
  } else if (logRegex.test(expression)) {
    const number = parseFloat(expression.match(logRegex)[1]);
    return `The logarithm base 10 of ${number} is the power to which the base 10 must be raised to obtain the number. 
    Mathematically, it is expressed as log(${number}). The result is ${math.log10(number).toString()}.`;
  } else if (trigRegex.test(expression)) {
    const match = expression.match(trigRegex);
    const func = match[1];
    const angle = parseFloat(match[2]);
    if (func === "sin") {
      return `The sine of an angle is a trigonometric function which gives the ratio of the length of the opposite side to the hypotenuse. 
      The sine of ${angle} degrees is ${math.sin(math.unit(angle, 'deg')).toString()}.`;
    }
    if (func === "cos") {
      return `The cosine of an angle is a trigonometric function which gives the ratio of the length of the adjacent side to the hypotenuse. 
      The cosine of ${angle} degrees is ${math.cos(math.unit(angle, 'deg')).toString()}.`;
    }
    if (func === "tan") {
      return `The tangent of an angle is a trigonometric function which gives the ratio of the length of the opposite side to the adjacent side. 
      The tangent of ${angle} degrees is ${math.tan(math.unit(angle, 'deg')).toString()}.`;
    }
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
  const { expression } = req.body;
  const result = performCalculation(expression);
  const explanation = getExplanation(expression);
