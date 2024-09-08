const math = require('mathjs');
const readline = require('readline-sync');

function getStepByStepCalculation(expression) {
  try {
    const steps = math.simplify(expression).toString();
    return steps;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

const expression = readline.question('Enter a mathematical expression: ');
console.log(`Expression: ${expression}`);
console.log(`Steps: ${getStepByStepCalculation(expression)}`);
