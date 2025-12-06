const express = require('express')
const math = require('mathjs')
const path = require('path')
const Decimal = require('decimal.js')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()
const port = process.env.PORT || 4000

// Security middleware - Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}))

// Rate limiting middleware for all endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
})

// Stricter rate limiting for calculate endpoint
const calculateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 calculations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many calculation requests, please try again later.'
})

app.use(limiter)
app.use(express.json({ limit: '100kb' })) // Limit request body size

// Configure Decimal.js for arbitrary precision
Decimal.set({ 
  precision: 1000, // Support up to 1000 digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000
})

// Create a new Math.js instance and define π as a constant
const mathInstance = math.create(math.all, {
  number: 'BigNumber',
  precision: 64
})

mathInstance.import({
  π: Math.PI
})

// Extended shorthand map with extremely large numbers
const shorthandRegex =
  /(\d+(\.\d+)?)(k|thousand|lakh|crore|million|billion|trillion|quadrillion|quintillion|sextillion|septillion|octillion|nonillion|decillion|undecillion|duodecillion|tredecillion|quattuordecillion|quindecillion|sexdecillion|septendecillion|octodecillion|novemdecillion|vigintillion|googol|googolplex|centillion|skewes|moser|grahams)/gi

const shorthandMap = {
  k: new Decimal('1e3'),
  thousand: new Decimal('1e3'),
  lakh: new Decimal('1e5'),
  crore: new Decimal('1e7'),
  million: new Decimal('1e6'),
  billion: new Decimal('1e9'),
  trillion: new Decimal('1e12'),
  quadrillion: new Decimal('1e15'),
  quintillion: new Decimal('1e18'),
  sextillion: new Decimal('1e21'),
  septillion: new Decimal('1e24'),
  octillion: new Decimal('1e27'),
  nonillion: new Decimal('1e30'),
  decillion: new Decimal('1e33'),
  undecillion: new Decimal('1e36'),
  duodecillion: new Decimal('1e39'),
  tredecillion: new Decimal('1e42'),
  quattuordecillion: new Decimal('1e45'),
  quindecillion: new Decimal('1e48'),
  sexdecillion: new Decimal('1e51'),
  septendecillion: new Decimal('1e54'),
  octodecillion: new Decimal('1e57'),
  novemdecillion: new Decimal('1e60'),
  vigintillion: new Decimal('1e63'),
  googol: new Decimal('1e100'),
  googolplex: 'GOOGOLPLEX', // Special marker for 10^googol
  centillion: new Decimal('1e303'),
  skewes: 'SKEWES', // Special marker for Skewes' number
  moser: 'MOSER', // Special marker for Moser's number  
  grahams: 'GRAHAMS' // Special marker for Graham's number
}

// Input validation and sanitization
function validateAndSanitizeExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    throw new Error('Invalid expression: must be a non-empty string')
  }
  
  // Limit expression length to prevent DoS
  const MAX_LENGTH = 10000
  if (expression.length > MAX_LENGTH) {
    throw new Error(`Expression too long: maximum ${MAX_LENGTH} characters allowed`)
  }
  
  // Remove potentially dangerous characters while preserving math symbols
  const sanitized = expression
    .replace(/[;<>{}\[\]\\]/g, '') // Remove dangerous characters
    .trim()
  
  // Check for suspicious patterns
  const dangerousPatterns = [
    /require\s*\(/i,
    /import\s+/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /__proto__/i,
    /constructor/i,
    /\$\{/,
    /`/
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Expression contains potentially unsafe patterns')
    }
  }
  
  return sanitized
}

// Function to handle tower exponentiation (power towers)
function evaluateTowerExponentiation(base, exponentExpression) {
  try {
    // Handle special large number cases
    if (exponentExpression === 'GOOGOLPLEX') {
      return {
        isSpecial: true,
        representation: `${base}^googolplex`,
        description: `This is ${base} raised to the power of googolplex (10^10^100), an incomprehensibly large number that cannot be computed or stored.`,
        approximation: 'Infinity (Computational representation impossible)'
      }
    }
    
    if (exponentExpression === 'SKEWES' || exponentExpression === 'MOSER' || exponentExpression === 'GRAHAMS') {
      const name = exponentExpression === 'SKEWES' ? "Skewes' number" : 
                   exponentExpression === 'MOSER' ? "Moser's number" : "Graham's number"
      return {
        isSpecial: true,
        representation: `${base}^${exponentExpression.toLowerCase()}`,
        description: `This is ${base} raised to the power of ${name}, a number far beyond conventional computation.`,
        approximation: 'Infinity (Beyond computational limits)'
      }
    }
    
    // Try to evaluate the exponent
    const exponent = new Decimal(exponentExpression)
    
    // Check if result would be too large
    const logResult = exponent.times(Decimal.log10(base))
    
    if (logResult.gt(1000)) {
      return {
        isSpecial: true,
        representation: `${base}^${exponentExpression}`,
        description: `This power tower evaluates to a number with more than 10^${logResult.toFixed(0)} digits.`,
        approximation: `~10^${exponent.times(Decimal.log10(base)).toFixed(2)}`
      }
    }
    
    // Calculate if reasonable
    const result = new Decimal(base).pow(exponent)
    return {
      isSpecial: false,
      result: result
    }
  } catch (error) {
    throw new Error(`Error evaluating tower exponentiation: ${error.message}`)
  }
}

// Function to handle calculations
function handleCalculation(expression) {
  const sqrtRegex = /squareroot(\d+)/
  const squareRegex = /square(\d+)/
  const vietaRegex = /vieta\((\d+)\)/ // Vieta's formula regex
  const towerRegex = /(\d+)\^(\d+)\^([\w\+\-\*\/\(\)]+)/g // Tower exponentiation like 10^10^googolplex

  try {
    // Validate and sanitize input
    expression = validateAndSanitizeExpression(expression)
    
    const question = `What is the result of: ${expression}?`
    let solution
    let explanation

    // Handle tower exponentiation (e.g., 10^10^googolplex)
    const towerMatch = expression.match(towerRegex)
    if (towerMatch) {
      const [fullMatch, base, firstExp, secondExp] = towerMatch[0].match(/(\d+)\^(\d+)\^([\w\+\-\*\/\(\)]+)/)
      
      // First evaluate middle exponent
      let middleResult
      if (shorthandMap[secondExp.toLowerCase()]) {
        const shorthandValue = shorthandMap[secondExp.toLowerCase()]
        if (typeof shorthandValue === 'string') {
          middleResult = shorthandValue // Special marker
        } else {
          middleResult = new Decimal(firstExp).pow(shorthandValue).toString()
        }
      } else {
        middleResult = new Decimal(firstExp).pow(new Decimal(secondExp)).toString()
      }
      
      const towerResult = evaluateTowerExponentiation(base, middleResult)
      
      if (towerResult.isSpecial) {
        solution = towerResult.approximation
        explanation = `${towerResult.description}\n\nRepresentation: ${towerResult.representation}\n\nThis number is so large it exceeds the storage capacity of any computer system ever built or conceivable.`
      } else {
        solution = towerResult.result.toFixed()
        explanation = `The tower exponentiation ${fullMatch} evaluates to ${solution}.`
      }
      
      return { question, solution, explanation }
    }

    // Handle shorthand notation with Decimal.js
    expression = expression.replace(
      shorthandRegex,
      (match, number, _, term) => {
        const base = new Decimal(number)
        const unit = term.toLowerCase()
        const multiplier = shorthandMap[unit]
        
        if (multiplier) {
          if (typeof multiplier === 'string') {
            // Handle special undefined numbers
            if (multiplier === 'GOOGOLPLEX') {
              return `10^(10^100 * ${number})`
            } else if (multiplier === 'SKEWES') {
              return `10^(10^(10^34) * ${number})`
            } else if (multiplier === 'MOSER' || multiplier === 'GRAHAMS') {
              throw new Error(`${term} is beyond computational representation. Use in power tower notation for description.`)
            }
          }
          return base.times(multiplier).toString()
        } else {
          throw new Error(`Unsupported shorthand term: ${term}`)
        }
      }
    )

    // Handle chained expressions like y=29-x=squareroot9
    if (expression.includes('=') && !expression.match(/[<>!]=?/)) {
      const parts = expression.split('=')
      const lastPart = parts.pop().trim()
      let intermediateExpression = lastPart

      if (sqrtRegex.test(lastPart)) {
        const number = parseFloat(lastPart.match(sqrtRegex)[1])
        intermediateExpression = new Decimal(number).sqrt().toString()
      } else if (squareRegex.test(lastPart)) {
        const number = parseFloat(lastPart.match(squareRegex)[1])
        intermediateExpression = new Decimal(number).pow(2).toString()
      } else {
        intermediateExpression = mathInstance.evaluate(lastPart).toString()
      }

      const evaluatedExpression = parts.concat(intermediateExpression).join('=')
      solution = mathInstance.evaluate(evaluatedExpression).toString()
      explanation = `The result of evaluating "${expression}" is ${solution}.`

      return { question, solution, explanation }
    }

    // Handle Vieta's formula
    if (vietaRegex.test(expression)) {
      const iterations = parseInt(expression.match(vietaRegex)[1], 10)
      
      if (iterations > 1000) {
        throw new Error('Vieta iterations limited to 1000 for performance reasons')
      }
      
      let product = new Decimal(1)
      let term = new Decimal(0.5).sqrt()
      
      for (let i = 1; i <= iterations; i++) {
        product = product.times(term)
        term = new Decimal(0.5).plus(new Decimal(0.5).times(term)).sqrt()
      }
      
      solution = new Decimal(2).div(product).toFixed(Math.min(50, iterations))
      explanation = `Vieta's formula approximates π as the iterations increase. With ${iterations} iterations, the result is ${solution}.`
    }
    // Handle square root
    else if (sqrtRegex.test(expression)) {
      const number = parseFloat(expression.match(sqrtRegex)[1])
      const result = new Decimal(number).sqrt()
      solution = result.toFixed()
      explanation = `The square root of ${number} is √${number}, resulting in ${solution}.`
    }
    // Handle square
    else if (squareRegex.test(expression)) {
      const number = parseFloat(expression.match(squareRegex)[1])
      const result = new Decimal(number).pow(2)
      solution = result.toFixed()
      explanation = `The square of ${number} is ${solution}.`
    }
    // Default evaluation with enhanced error handling
    else {
      try {
        // Use Decimal.js for handling large numbers
        const evalResult = mathInstance.evaluate(expression)
        const decimalResult = new Decimal(evalResult.toString())
        
        // Check if number is too large to represent
        if (!decimalResult.isFinite()) {
          solution = 'Infinity'
          explanation = `The result of evaluating "${expression}" exceeds representable limits (Infinity).`
        } else {
          solution = decimalResult.toFixed()
          explanation = `The result of evaluating "${expression}" is ${solution}.`
        }
      } catch (evalError) {
        throw new Error(`Evaluation error: ${evalError.message}`)
      }
    }

    return { question, solution, explanation }
  } catch (error) {
    console.error('Calculation error:', error.message)
    return {
      question: `What is the result of: ${expression}?`,
      solution: 'Error',
      explanation: `Calculation error: ${error.message || 'Unsupported operation or invalid expression.'}`
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(
    'Welcome to the Math Calculator API! You can visit the calculator by going to /calculator'
  )
})

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/calculate', calculateLimiter, (req, res) => {
  try {
    const { expression } = req.body
    
    if (!expression) {
      return res.status(400).json({
        question: 'Invalid request',
        solution: 'Error',
        explanation: 'Expression field is required'
      })
    }
    
    const response = handleCalculation(expression)
    res.json(response)
  } catch (error) {
    console.error('Request error:', error.message)
    res.status(400).json({
      question: 'Error',
      solution: 'Error',
      explanation: error.message || 'Invalid request'
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// Start the server
const server = app.listen(port, () => {
  console.log(`Math Calculator API is running at http://localhost:${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

module.exports = app
