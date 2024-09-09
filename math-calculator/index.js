const math = require('mathjs');
const readline = require('readline-sync');

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

// Get user input
const expression = readline.question('Enter a mathematical expression: ');
const steps = getStepByStepCalculation(expression);
const solution = steps[steps.length - 1];

console.log(`Question: ${expression}`);
console.log(`Solution: ${solution}`);
