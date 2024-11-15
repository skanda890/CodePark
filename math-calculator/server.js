const express = require('express');
const math = require('mathjs');
const path = require('path');
const axios = require('axios');
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

// POST route for calculations
app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  const solution = performCalculation(expression);
  res.json({ 
    question: expression,  
    solution 
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Function to make a request to the /calculate endpoint
  async function calculateExpression() {
    try {
      const response = await axios.post(`http://localhost:${port}/calculate`, {
        expression: '99.99 - 99'
      });
      console.log('Question:', response.data.question);
      console.log('Solution:', response.data.solution);
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  }

  // Call the function to make the request
  calculateExpression();
});
