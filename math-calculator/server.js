const express = require('express');
const math = require('mathjs');
const path = require('path');
const app = express();
const port = 4000; // Set the port to 4000

app.use(express.json());

// Define π as a constant
math.import({
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
    const node = math.parse(expression);
    const steps = [];

    function simplifyStep(node) {
      const simplified = math.simplify(node);
      steps.push(simplified.toString());
      return simplified;
    }

    simplifyStep(node);
    return steps;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to perform the calculation and format the result as both fraction and decimal
function performCalculation(expression) {
  const result = math.evaluate(expression);
  const fractionResult = math.format(result, { fraction: 'ratio' });
  const decimalResult = math.format(result, { notation: 'fixed', precision: 10 });
  return { fraction: fractionResult, decimal: decimalResult };
}

// POST route for calculations
app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  const solution = performCalculation(expression); // Use the performCalculation function here
  res.json({ 
    question: expression,  
    solution 
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
