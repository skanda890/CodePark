const readline = require('readline')

/**
 * Starts an interactive CLI number guessing game.
 * @param {Function} onSuccess - Callback to invoke when the user wins.
 */
function startCliGame (onSuccess) {
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

      let message
      let shouldContinue = false

      if (isNaN(guess)) {
        message = 'Please enter a valid number.'
        shouldContinue = true
      } else if (guess < randomNumber) {
        message = 'Too low! Try again.'
        shouldContinue = true
      } else if (guess > randomNumber) {
        message = 'Too high! Try again.'
        shouldContinue = true
      } else {
        message = `\nCongratulations! You guessed the number in ${attempts} attempt(s).`
      }

      console.log(message)

      if (shouldContinue) {
        askQuestion()
      } else {
        rl.close()
        if (typeof onSuccess === 'function') onSuccess()
      }
    })
  }

  askQuestion()
}

module.exports = { startCliGame }
