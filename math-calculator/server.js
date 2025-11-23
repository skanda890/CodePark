const express = require('express')
const math = require('mathjs')
const path = require('path')
const Decimal = require('decimal.js')

const app = express()
const port = 4000

app.use(express.json())

// Create a new Math.js instance and define π as a constant
const mathInstance = math.create(math.all)
mathInstance.import({
  π: Math.PI
})

// Shorthand regex and map
const shorthandRegex =
  /(\d+(\.\d+)?)(k|thousand|lakh|crore|million|billion|trillion|quadrillion|quintillion|sextillion|septillion|octillion|nonillion|decillion|undecillion|duodecillion|tredecillion|quattuordecillion|quindecillion|sexdecillion|septendecillion|octodecillion|novemdecillion|vigintillion|googol|centillion)/gi
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
  googol: 1e100,
  centillion: 1e300
}

// Function to handle calculations
function handleCalculation (expression) {
  const sqrtRegex = /squareroot(\d+)/
  const squareRegex = /square(\d+)/
  const vietaRegex = /vieta\((\d+)\)/ // Vieta's formula regex

  try {
    const question = `What is the result of: ${expression}?`
    let solution
    let explanation

    // Handle shorthand notation
    expression = expression.replace(
      shorthandRegex,
      (match, number, _, term) => {
        const base = parseFloat(number)
        const unit = term.toLowerCase()
        if (shorthandMap[unit]) {
          return base * shorthandMap[unit]
        } else {
          throw new Error('Unsupported shorthand term.')
        }
      }
    )

    // Handle chained expressions like y=29-x=squareroot9
    if (expression.includes('=')) {
      const parts = expression.split('=')
      const lastPart = parts.pop().trim() // Solve the last part
      let intermediateExpression = lastPart

      if (sqrtRegex.test(lastPart)) {
        const number = parseFloat(lastPart.match(sqrtRegex)[1])
        intermediateExpression = Math.sqrt(number).toString()
      } else if (squareRegex.test(lastPart)) {
        const number = parseFloat(lastPart.match(squareRegex)[1])
        intermediateExpression = Math.pow(number, 2).toString()
      } else {
        intermediateExpression = mathInstance.evaluate(lastPart).toString()
      }

      // Back substitute intermediate results
      const evaluatedExpression = parts
        .concat(intermediateExpression)
        .join('=')
      solution = mathInstance.evaluate(evaluatedExpression)
      explanation = `The result of evaluating "${expression}" is ${solution}.`

      return { question, solution, explanation }
    }

    // Handle Vieta's formula
    if (vietaRegex.test(expression)) {
      const iterations = parseInt(expression.match(vietaRegex)[1], 10)
      let product = 1
      let term = Math.sqrt(0.5)
      for (let i = 1; i <= iterations; i++) {
        product *= term
        term = Math.sqrt(0.5 + 0.5 * term)
      }
      solution = (2 / product).toFixed(10)
      explanation = `Vieta's formula approximates π as the iterations increase. With ${iterations} iterations, the result is ${solution}.`
    }
    // Handle square root
    else if (sqrtRegex.test(expression)) {
      const number = parseFloat(expression.match(sqrtRegex)[1])
      solution = Math.sqrt(number)
      explanation = `The square root of ${number} is √${number}, resulting in ${solution}.`
    }
    // Handle square
    else if (squareRegex.test(expression)) {
      const number = parseFloat(expression.match(squareRegex)[1])
      solution = Math.pow(number, 2)
      explanation = `The square of ${number} is ${solution}.`
    }
    // Default evaluation
    else {
      // Use Decimal.js for handling large numbers
      const decimalResult = new Decimal(mathInstance.evaluate(expression))
      solution = decimalResult.toFixed() // Use .toFixed() for a more readable format
      explanation = `The result of evaluating "${expression}" is ${solution}.`
    }

    return { question, solution, explanation }
  } catch (error) {
    return {
      question: `What is the result of: ${expression}?`,
      solution: 'Error',
      explanation: 'Unsupported operation or calculation error.'
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(
    'Welcome to the Math Calculator API! You can visit the calculator by going to port 4000/calculator'
  )
})

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/calculate', (req, res) => {
  const { expression } = req.body
  const response = handleCalculation(expression)
  res.json(response)
})

// Start the server
app.listen(port, () => {
  console.log(`Math Calculator API is running at http://localhost:${port}`)
})
