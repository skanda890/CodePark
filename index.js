const express = require('express')
const readline = require('readline')

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CodePark API',
    version: '1.0.0',
    status: 'running'
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Number guessing game endpoint
app.get('/game/guess', (req, res) => {
  const randomNumber = Math.floor(Math.random() * 100) + 1
  res.json({
    message:
      'Number guessing game started! Try to guess a number between 1 and 100.',
    hint: 'Use POST /game/check with {"guess": number} to check your guess'
  })
})

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
  console.log(`Health check: http://localhost:${port}/health`)
})

// CLI Number Guessing Game (only if running in interactive mode)
if (process.stdin.isTTY && process.argv.includes('--game')) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const randomNumber = Math.floor(Math.random() * 100) + 1
  let attempts = 0

  console.log('\n=== Welcome to the Number Guessing Game! ===')
  console.log(
    'I have selected a random number between 1 and 100. Can you guess it?\n'
  )

  const askQuestion = () => {
    rl.question('Enter your guess: ', (answer) => {
      const guess = parseInt(answer, 10)
      attempts += 1

      if (isNaN(guess)) {
        console.log('Please enter a valid number.')
        askQuestion()
      } else if (guess < randomNumber) {
        console.log('Too low! Try again.')
        askQuestion()
      } else if (guess > randomNumber) {
        console.log('Too high! Try again.')
        askQuestion()
      } else {
        console.log(
          `\nCongratulations! You guessed the number in ${attempts} attempt(s).`
        )
        rl.close()
        server.close(() => {
          console.log('Server closed.')
          process.exit(0)
        })
      }
    })
  }

  askQuestion()
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

module.exports = app
