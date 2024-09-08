const express = require('express');
const math = require('mathjs');
const app = express();
const port = 4000;

app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('Welcome to the Math Calculator API!');
});

app.post('/calculate', (req, res) => {
  const expression = req.body.expression;
  const steps = getStepByStepCalculation(expression);
  res.json({ expression, steps });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
