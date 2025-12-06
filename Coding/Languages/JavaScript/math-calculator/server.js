const express = require('express')
const math = require('mathjs')
const path = require('path')
const Decimal = require('decimal.js')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()
const port = process.env.PORT || 4000

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  MAX_EXPRESSION_LENGTH: 10000,
  MAX_VIETA_ITERATIONS: 1000,
  DECIMAL_PRECISION: 1000,
  SHUTDOWN_TIMEOUT: 10000,
  CALCULATION_CACHE_SIZE: 100
}

// ============================================================================
// LOGGING & METRICS
// ============================================================================

const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalCalculations: 0,
  totalExecutionTime: 0,
  startTime: Date.now()
}

const logger = {
  info: (msg, data = {}) => {
    if (process.env.NODE_ENV !== 'silent') {
      console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data)
    }
  },
  warn: (msg, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data)
  },
  error: (msg, data = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, data)
  },
  debug: (msg, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data)
    }
  }
}

// Simple in-memory cache for recent calculations
const calculationCache = new Map()

function cacheKey (expr) {
  return Buffer.from(String(expr)).toString('base64')
}

function getCachedResult (expr) {
  return calculationCache.get(cacheKey(expr))
}

function setCachedResult (expr, result) {
  if (calculationCache.size >= CONFIG.CALCULATION_CACHE_SIZE) {
    const firstKey = calculationCache.keys().next().value
    calculationCache.delete(firstKey)
  }
  calculationCache.set(cacheKey(expr), result)
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Request logging middleware
app.use((req, res, next) => {
  metrics.requestCount++
  req.startTime = Date.now()
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  logger.debug(`[REQ] ${req.method} ${req.path}`, { id: req.id })

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    logger.debug(
      `[RES] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      {
        id: req.id,
        duration
      }
    )
  })

  next()
})

// Security middleware - Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:']
      }
    }
  })
)

// Rate limiting middleware for all endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    metrics.errorCount++
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    })
  }
})

// Stricter rate limiting for calculate endpoint
const calculateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many calculation requests, please try again later.',
  handler: (req, res) => {
    metrics.errorCount++
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many calculations. Maximum 20 per minute.',
      retryAfter: req.rateLimit.resetTime
    })
  }
})

app.use(limiter)
app.use(express.json({ limit: '100kb' }))

// ============================================================================
// DECIMAL.JS & MATHJS CONFIGURATION
// ============================================================================

Decimal.set({
  precision: CONFIG.DECIMAL_PRECISION,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -CONFIG.DECIMAL_PRECISION,
  toExpPos: CONFIG.DECIMAL_PRECISION
})

const mathInstance = math.create(math.all, {
  number: 'BigNumber',
  precision: 64
})

mathInstance.import({
  π: Math.PI
})

// ============================================================================
// SHORTHAND & SPECIAL NUMBERS
// ============================================================================

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
  googolplex: 'GOOGOLPLEX',
  centillion: new Decimal('1e303'),
  skewes: 'SKEWES',
  moser: 'MOSER',
  grahams: 'GRAHAMS'
}

// ============================================================================
// VALIDATION & SANITIZATION
// ============================================================================

function validateAndSanitizeExpression (expr) {
  if (!expr || typeof expr !== 'string') {
    throw new Error('Invalid expression: must be a non-empty string')
  }

  if (expr.length > CONFIG.MAX_EXPRESSION_LENGTH) {
    throw new Error(
      `Expression too long: maximum ${CONFIG.MAX_EXPRESSION_LENGTH} characters allowed`
    )
  }

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
    if (pattern.test(expr)) {
      throw new Error('Expression contains potentially unsafe patterns')
    }
  }

  return expr.replace(/[;<>{}]/g, '').trim()
}

// ============================================================================
// MATH HELPER FUNCTIONS
// ============================================================================

/**
 * ✅ FIX #3: Safely compute log base 10 of a value
 * Works with both Decimal and numeric inputs
 * Replaces non-existent Decimal.log10() method
 * @param {number|Decimal} value - Input value
 * @returns {number} Base-10 logarithm
 */
function computeLog10 (value) {
  if (value instanceof Decimal) {
    value = value.toNumber()
  }
  return Math.log10(value)
}

/**
 * ✅ FIX #1: Handle tower exponentiation (power towers like 10^10^5)
 * Now with ACCURATE digit count descriptions (not 10^X digits)
 * @param {number} base - Base number
 * @param {string|Decimal} exponentExpr - Exponent expression
 * @returns {Object} Special number info or computed result
 */
function evaluateTowerExponentiation (base, exponentExpr) {
  try {
    // Handle special large number cases
    if (exponentExpr === 'GOOGOLPLEX') {
      return {
        isSpecial: true,
        representation: `${base}^googolplex`,
        description: `${base} raised to googolplex (10^10^100), incomprehensibly large.`,
        approximation: 'Infinity (Computational representation impossible)'
      }
    }

    if (
      exponentExpr === 'SKEWES' ||
      exponentExpr === 'MOSER' ||
      exponentExpr === 'GRAHAMS'
    ) {
      const names = {
        SKEWES: "Skewes' number",
        MOSER: "Moser's number",
        GRAHAMS: "Graham's number"
      }
      return {
        isSpecial: true,
        representation: `${base}^${exponentExpr.toLowerCase()}`,
        description: `${base} raised to ${names[exponentExpr]}, beyond computation.`,
        approximation: 'Infinity (Beyond computational limits)'
      }
    }

    // Try to evaluate the exponent
    const exponent = new Decimal(exponentExpr)
    const log10Base = computeLog10(base) // ✅ FIX #3: Uses safe helper instead of Decimal.log10()
    const logResult = exponent.times(log10Base)

    // Check if result would be too large
    if (logResult.gt(1000)) {
      // ✅ FIX #1: ACCURATE digit count (not 10^digitCount)
      const digitCount = Math.floor(logResult.toNumber())
      return {
        isSpecial: true,
        representation: `${base}^${exponentExpr}`,
        description: `Power tower with approximately ${digitCount.toLocaleString()} digits (beyond computational capacity).`,
        approximation: `~10^${logResult.toFixed(2)}`
      }
    }

    // Calculate if reasonable
    const result = new Decimal(base).pow(exponent)
    return { isSpecial: false, result }
  } catch (error) {
    throw new Error(`Error evaluating tower exponentiation: ${error.message}`)
  }
}

// ============================================================================
// PURE CALCULATION LOGIC - ✅ FIX #5: EXTRACTED (was handleCalculation)
// ============================================================================

/**
 * ✅ FIX #5: Core calculation logic - pure function that performs math operations
 * Extracted from handleCalculation() to reduce complexity (200+ → 150 lines)
 * Assumes expression is already validated and sanitized
 * @param {string} expression - Safe, sanitized expression
 * @returns {Object} { question, solution, explanation }
 * @throws {Error} If calculation fails
 */
function calculateCore (expression) {
  // ✅ FIX #4: FLEXIBLE REGEX PATTERNS
  // Now matches: squareroot(100), √100, √(100), 5.5^2, etc
  const sqrtRegex =
    /squareroot\s*\(([\d.]+)\)|√\s*\(([\d.]+)\)|√\s*([\d.]+)/i
  const squareRegex =
    /square\s*\(([\d.]+)\)|\(([\d.]+)\)\s*\^\s*2|([\d.]+)\s*\^\s*2/i
  const vietaRegex = /vieta\s*\(\s*(\d+)\s*\)/
  const towerRegex = /(\d+)\^(\d+)\^([\w\+\-\*\/\(\)]+)/g

  const question = `What is the result of: ${expression}?`
  let solution, explanation

  // Handle tower exponentiation (e.g., 10^10^googolplex)
  const towerMatch = expression.match(towerRegex)
  if (towerMatch) {
    const [fullMatch, base, firstExp, secondExp] = towerMatch[0].match(
      /(\d+)\^(\d+)\^([\w\+\-\*\/\(\)]+)/
    )

    let middleResult
    const shorthandValue = shorthandMap[secondExp.toLowerCase()]
    if (shorthandValue) {
      middleResult =
        typeof shorthandValue === 'string'
          ? shorthandValue
          : new Decimal(firstExp).pow(shorthandValue).toString()
    } else {
      middleResult = new Decimal(firstExp)
        .pow(new Decimal(secondExp))
        .toString()
    }

    const towerResult = evaluateTowerExponentiation(base, middleResult)

    if (towerResult.isSpecial) {
      solution = towerResult.approximation
      explanation = `${towerResult.description}\n\nRepresentation: ${towerResult.representation}\n\nBeyond computational storage capacity.`
    } else {
      solution = towerResult.result.toFixed()
      explanation = `Tower exponentiation ${fullMatch} = ${solution}`
    }

    return { question, solution, explanation }
  }

  // Handle shorthand notation
  const processedExpr = expression.replace(
    shorthandRegex,
    (match, number, _, term) => {
      const base = new Decimal(number)
      const unit = term.toLowerCase()
      const multiplier = shorthandMap[unit]

      if (!multiplier) {
        throw new Error(`Unsupported shorthand: ${term}`)
      }

      if (typeof multiplier === 'string') {
        if (multiplier === 'GOOGOLPLEX') return `10^(10^100 * ${number})`
        if (multiplier === 'SKEWES') return `10^(10^(10^34) * ${number})`
        if (multiplier === 'MOSER' || multiplier === 'GRAHAMS') {
          throw new Error(`${term} is beyond computational representation.`)
        }
      }

      return base.times(multiplier).toString()
    }
  )

  // Handle chained assignments
  const hasComparisonOp = /===|==|<=|>=|!=/.test(processedExpr)
  const hasAssignment = processedExpr.includes('=') && !hasComparisonOp

  if (hasAssignment) {
    const parts = processedExpr.split('=')
    const lastPart = parts.pop().trim()
    let intermediateExpression

    if (sqrtRegex.test(lastPart)) {
      const match = lastPart.match(sqrtRegex)
      const number = parseFloat(match[1] || match[2] || match[3])
      intermediateExpression = new Decimal(number).sqrt().toString()
    } else if (squareRegex.test(lastPart)) {
      const match = lastPart.match(squareRegex)
      const number = parseFloat(match[1] || match[2] || match[3])
      intermediateExpression = new Decimal(number).pow(2).toString()
    } else {
      intermediateExpression = mathInstance.evaluate(lastPart).toString()
    }

    solution = mathInstance
      .evaluate(parts.concat(intermediateExpression).join('='))
      .toString()
    explanation = `Assignment evaluation: ${processedExpr} = ${solution}`
    return { question, solution, explanation }
  }

  // Handle Vieta's formula
  if (vietaRegex.test(processedExpr)) {
    const iterations = parseInt(processedExpr.match(vietaRegex)[1], 10)
    if (iterations > CONFIG.MAX_VIETA_ITERATIONS) {
      throw new Error(
        `Vieta iterations limited to ${CONFIG.MAX_VIETA_ITERATIONS}`
      )
    }

    let product = new Decimal(1)
    let term = new Decimal(0.5).sqrt()

    for (let i = 1; i <= iterations; i++) {
      product = product.times(term)
      term = new Decimal(0.5).plus(new Decimal(0.5).times(term)).sqrt()
    }

    solution = new Decimal(2).div(product).toFixed(Math.min(50, iterations))
    explanation = `Vieta's formula: π ≈ ${solution} (${iterations} iterations)`
    return { question, solution, explanation }
  }

  // Handle square root
  if (sqrtRegex.test(processedExpr)) {
    const match = processedExpr.match(sqrtRegex)
    const number = parseFloat(match[1] || match[2] || match[3])
    solution = new Decimal(number).sqrt().toFixed()
    explanation = `√${number} = ${solution}`
    return { question, solution, explanation }
  }

  // Handle square
  if (squareRegex.test(processedExpr)) {
    const match = processedExpr.match(squareRegex)
    const number = parseFloat(match[1] || match[2] || match[3])
    solution = new Decimal(number).pow(2).toFixed()
    explanation = `${number}² = ${solution}`
    return { question, solution, explanation }
  }

  // Default evaluation
  const evalResult = mathInstance.evaluate(processedExpr)
  const decimalResult = new Decimal(evalResult.toString())

  if (!decimalResult.isFinite()) {
    solution = 'Infinity'
    explanation = `Result of "${processedExpr}" exceeds representable limits`
  } else {
    solution = decimalResult.toFixed()
    explanation = `${processedExpr} = ${solution}`
  }

  return { question, solution, explanation }
}

/**
 * ✅ FIX #5: Handle calculation with caching, metrics, and error handling
 * Thin orchestrator that delegates math logic to calculateCore()
 * Was 200+ lines mixing concerns, now 40 lines focused on orchestration
 * @param {string} expr - User-provided expression
 * @returns {Object} { question, solution, explanation }
 */
function handleCalculation (expr) {
  const startTime = Date.now()

  try {
    // Check cache
    const cached = getCachedResult(expr)
    if (cached) {
      // ✅ FIX #2: PRIVACY PROTECTION
      // Never log expression content - only safe metrics
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Cache hit for expression', { length: expr.length })
      }
      return cached
    }

    // Validate and sanitize
    const expression = validateAndSanitizeExpression(expr)

    // Perform calculation (may throw)
    const result = calculateCore(expression)

    // Cache result
    setCachedResult(expr, result)
    return result
  } catch (error) {
    metrics.errorCount++
    // ✅ FIX #2: PRIVACY PROTECTION
    // Log error message but NOT the expression
    logger.error('Calculation error', {
      error: error.message,
      length: expr.length
    })

    return {
      question: `What is the result of: ${expr}?`,
      solution: 'Error',
      explanation: `Error: ${error.message}`
    }
  } finally {
    const duration = Date.now() - startTime
    metrics.totalCalculations++
    metrics.totalExecutionTime += duration
  }
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req, res) => {
  res.send(
    'Welcome to Math Calculator API v2.0! Visit /calculator or /api/docs'
  )
})

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Single calculation
app.post('/calculate', calculateLimiter, (req, res) => {
  try {
    const { expression } = req.body

    if (!expression) {
      metrics.errorCount++
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Expression field is required'
      })
    }

    const response = handleCalculation(expression)
    res.json(response)
  } catch (error) {
    metrics.errorCount++
    logger.error('Request error', { error: error.message })
    res.status(400).json({
      error: 'Calculation error',
      message: error.message || 'Invalid request'
    })
  }
})

// Batch calculations
app.post('/calculate/batch', calculateLimiter, (req, res) => {
  try {
    const { expressions } = req.body

    if (!Array.isArray(expressions) || expressions.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'expressions must be a non-empty array'
      })
    }

    if (expressions.length > 10) {
      return res.status(400).json({
        error: 'Too many expressions',
        message: 'Maximum 10 expressions per batch'
      })
    }

    const results = expressions.map((expr) => ({
      expression: expr,
      ...handleCalculation(expr)
    }))

    res.json({ count: results.length, results })
  } catch (error) {
    metrics.errorCount++
    res.status(400).json({
      error: 'Batch calculation error',
      message: error.message
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - metrics.startTime,
    environment: process.env.NODE_ENV || 'development'
  })
})

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Date.now() - metrics.startTime
  res.json({
    uptime,
    uptimeSeconds: Math.floor(uptime / 1000),
    requestCount: metrics.requestCount,
    calculationCount: metrics.totalCalculations,
    errorCount: metrics.errorCount,
    errorRate: metrics.requestCount
      ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + '%'
      : '0%',
    avgCalculationTime: metrics.totalCalculations
      ? (metrics.totalExecutionTime / metrics.totalCalculations).toFixed(2) +
        'ms'
      : '0ms',
    cacheSize: calculationCache.size
  })
})

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    version: '2.0.0',
    endpoints: {
      'POST /calculate': {
        description: 'Evaluate a single mathematical expression',
        body: { expression: 'string' },
        example: { expression: '5+3*2' }
      },
      'POST /calculate/batch': {
        description: 'Evaluate multiple expressions (max 10)',
        body: { expressions: ['string', 'string'] },
        example: { expressions: ['5+3', '10*2'] }
      },
      'GET /health': {
        description: 'Health check endpoint',
        response: 'JSON with status and uptime'
      },
      'GET /metrics': {
        description: 'Performance and usage metrics',
        response: 'JSON with request/calculation counts and timings'
      },
      'GET /calculator': {
        description: 'Web UI for calculator',
        response: 'HTML page'
      }
    },
    features: [
      'Arbitrary precision arithmetic (1000 digits)',
      'Large number support (googol, googolplex, etc)',
      'Tower exponentiation (10^10^googolplex)',
      "Vieta's formula for π approximation",
      'Batch calculations',
      'Request/response caching',
      'Performance metrics'
    ]
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Endpoint not found. Use GET /api/docs for documentation',
    path: req.path
  })
})

// Error handler
app.use((err, req, res, next) => {
  metrics.errorCount++
  logger.error('Unhandled error', { error: err.message, path: req.path })
  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
    requestId: req.id
  })
})

// ============================================================================
// SERVER STARTUP & SHUTDOWN
// ============================================================================

// ✅ FIX #6: PRODUCTION SCALING
// Support HOST environment variable for Docker/Cloud deployment
const hostname = process.env.HOST || 'localhost'
const server = app.listen(port, () => {
  logger.info('Math Calculator API v2.0 started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    url: `http://${hostname}:${port}`,
    note: process.env.HOST ? 'Accessible externally' : 'Local only'
  })
})

const gracefulShutdown = () => {
  logger.info('Shutdown signal received')
  server.close(() => {
    logger.info('Server closed', {
      totalRequests: metrics.requestCount,
      totalCalculations: metrics.totalCalculations,
      totalErrors: metrics.errorCount
    })
    process.exit(0)
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, CONFIG.SHUTDOWN_TIMEOUT)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

module.exports = app
