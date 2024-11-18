const express = require('express');
const math = require('mathjs');
const path = require('path');
const Decimal = require('decimal.js');

const app = express();
const port = 4000;

app.use(express.json());

// Create a new Math.js instance and define π as a constant
const mathInstance = math.create(math.all);
mathInstance.import({
  π: Math.PI
});

// Shorthand map for large number terms
const shorthandMap = {
  k: 1e3, // Thousand
  thousand: 1e3,
  lakh: 1e5, // South Asian notation
  crore: 1e7,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
  quadrillion: 1e15,
  quintillion: 1e18,
  sextillion: 1e21,
  septillion: 1e24,
  octillion: 1e27,
  nonillion: 1e30,
  decillion: 1e33,
  undecillion: 1e36,
  duodecillion: 1e39,
  tredecillion: 1e42,
  quattuordecillion: 1e45,
  quindecillion: 1e48,
  sexdecillion: 1e51,
  septendecillion: 1e54,
  octodecillion: 1e57,
  novemdecillion: 1e60,
  vigintillion: 1e63,
  unvigintillion: 1e66,
  duovigintillion: 1e69,
  trevigintillion: 1e72,
  quattuorvigintillion: 1e75,
  quinvigintillion: 1e78,
  sexvigintillion: 1e81,
  septenvigintillion: 1e84,
  octovigintillion: 1e87,
  novemvigintillion: 1e90,
  trigintillion: 1e93,
  untrigintillion: 1e96,
  duotrigintillion: 1e99,
  googol: 1e100, // Special name for 10^100
  centillion: 1e303 // Standard term for 10^300
};

// Serve the HTML file at a different route
app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to handle calculations, including the question, solution, and explanation
function handleCalculation(expression) {
  const shorthandRegex = /(\d+(\.\d+)?)(k|thousand|lakh|crore|million|billion|trillion|quadrillion|quintillion|sextillion|septillion|octillion|nonillion|decillion|undecillion|duodecillion|tredecillion|quattuordecillion|quindecillion|sexdecillion|septendecillion|octodecillion|novemdecillion|vigintillion|unvigintillion|duovigintillion|trevigintillion|quattuorvigintillion|quinvigintillion|sexvigintillion|septenvigintillion|octovigintillion|novemvigintillion|trigintillion|untrigintillion|duotrigintillion|googol|centillion)/i;
  const vietaRegex = /vieta\((\d+)\)/;
  
  try {
    let question = `What is the result of: ${expression}?`;
    let solution;
    let explanation;

    if (shorthandRegex.test(expression)) {
      const match = expression.match(shorthandRegex);
      const base = parseFloat(match[1]);
      const term = match[3].toLowerCase();

      if (shorthandMap[term]) {
        solution = base * shorthandMap[term];
        explanation = `The shorthand "${base}${term}" is equivalent to ${solution}.`;
      } else {
        throw new Error('Unsupported shorthand term.');
      }
    } else if (vietaRegex.test(expression)) {
      const iterations = parseInt(expression.match(vietaRegex)[1], 10);

      let product = 1;
      let term = Math.sqrt(0.5); // Initial term
      for (let i = 1; i <= iterations; i++) {
        product *= term;
        term = Math.sqrt(0.5 + 0.5 * term); // Generate the next term
      }
      solution = (2 / product).toFixed(10); // Multiply by 2 and format to 10 decimal places
      explanation = `Vieta's formula approximates π as the iterations increase. With ${iterations} iterations, the result is ${solution}.`;
    } else {
      // Default evaluation if no specific case matches
      solution = mathInstance.evaluate(expression).toString();
      explanation = `The result of evaluating "${expression}" is ${solution}.`;
    }

    return { question, solution, explanation };
  } catch (error) {
    return {
      question: `What is the result of: ${expression}?`,
      solution: 'Error',
      explanation: 'Unsupported operation or calculation error.'
    };
  }
}

// POST route for calculations
app.post('/calculate', (req, res) => {
  const { expression } = req.body;
  const response = handleCalculation(expression);
  res.json(response);
});

// Start the server
app.listen(port, () => {
  console.log(`Math Calculator API is running at http://localhost:${port}`);
});
