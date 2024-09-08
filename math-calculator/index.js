const math = require('mathjs');

function getStepByStepCalculation(expression) {
  try {
    const steps = math.simplify(expression).toString();
    return steps;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

const expression = '2 * (3 + 4)';
console.log(`Expression: ${expression}`);
console.log(`Steps: ${getStepByStepCalculation(expression)}`);
