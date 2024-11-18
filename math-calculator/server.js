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

// Shorthand mapping for large numbers
const shorthandMap = {
  k: 1e3,
  thousand: 1e3,
  lakh: 1e5,
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
  googol: 1e100,
  centillion: 1e303
};

// Route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Math Calculator API! You can visit the calculator by going to port 4000/calculator');
});

// Serve the HTML file at a different route
app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to handle calculations
function handleCalculation(expression) {
  const shorthandRegex = /(\d+(\.\d+)?)(k|thousand|lakh|crore|million|billion|trillion|quadrillion|quintillion|sextillion|septillion|octillion|nonillion|decillion|undecillion|duodecillion|tredecillion|quattuordecillion|quindecillion|sexdecillion|septendecillion|octodecillion|novemdecillion|vigintillion|unvigintillion|duovigintillion|trevigintillion|quattuorvigintillion|quinvigintillion|sexvigintillion|septenvigintillion|octovigintillion|novemvigintillion|trigintillion|untrigintillion|duotrigintillion|googol|centillion)/gi;
  const vietaRegex = /vieta\((\d+)\)/;

  try {
    let question = `What is the result of: ${expression}?`;
    let solution;
    let explanation;

    // Preprocess shorthand terms in the expression
    expression = expression.replace(shorthandRegex, (match, number, _, term) => {
      const base = parseFloat(number);
      const unit = term.toLowerCase();
      if (shorthandMap[unit]) {
        return base * shorthandMap[unit];
      } else {
        throw new Error('Unsupported shorthand term.');
      }
    });

    if (vietaRegex.test(expression)) {
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
      // Evaluate the processed expression
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
