const math = require('mathjs');
const readline = require('readline-sync');

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

