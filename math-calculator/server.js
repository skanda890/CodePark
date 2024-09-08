const express = require('express');
const math = require('mathjs');
const path = require('path');
const app = express();
const port = 4000; // Set the port to 4000

app.use(express.json());

// Route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Math Calculator API!');
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

// POST route for calculations
app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  const solution = steps[steps.length - 1];
  res.json({ 
    question: expression, 
    working: steps.join(' -> '), 
    solution 
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
