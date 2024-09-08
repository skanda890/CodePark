const express = require('express');
const math = require('mathjs');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

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
    return steps.join(' -> ');
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  res.json({ expression, steps });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
