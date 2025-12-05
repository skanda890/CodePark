/**
 * Number Guessing CLI Game
 * A simple interactive command-line number guessing game
 * 
 * @module games/cli/numberGuessing
 */

const readline = require('readline');

/**
 * Starts an interactive CLI number guessing game.
 * The game generates a random number between 1 and 100,
 * and the player must guess it with feedback provided.
 * 
 * @param {Object} options - Game configuration options
 * @param {number} [options.min=1] - Minimum number in range
 * @param {number} [options.max=100] - Maximum number in range
 * @param {Function} [options.onSuccess] - Callback to invoke when the user wins
 * @param {Function} [options.onAttempt] - Callback invoked after each attempt
 * @returns {void}
 * 
 * @example
 * const { startCliGame } = require('./games/cli/numberGuessing');
 * 
 * startCliGame({
 *   min: 1,
 *   max: 50,
 *   onSuccess: () => console.log('Winner!'),
 *   onAttempt: (attempt, guess) => console.log(`Attempt ${attempt}: ${guess}`)
 * });
 */
function startCliGame(options = {}) {
  // Default configuration
  const config = {
    min: 1,
    max: 100,
    onSuccess: null,
    onAttempt: null,
    ...options
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const randomNumber = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  let attempts = 0;

  console.log('\n=== Welcome to the Number Guessing Game! ===');
  console.log(`I have selected a random number between ${config.min} and ${config.max}. Can you guess it?\n`);

  const askQuestion = () => {
    rl.question('Enter your guess: ', (answer) => {
      const guess = parseInt(answer, 10);
      attempts += 1;

      let message;
      let shouldContinue = false;

      if (isNaN(guess)) {
        message = 'Please enter a valid number.';
        shouldContinue = true;
      } else if (guess < config.min || guess > config.max) {
        message = `Please enter a number between ${config.min} and ${config.max}.`;
        shouldContinue = true;
      } else if (guess < randomNumber) {
        message = 'Too low! Try again.';
        shouldContinue = true;
      } else if (guess > randomNumber) {
        message = 'Too high! Try again.';
        shouldContinue = true;
      } else {
        message = `\nCongratulations! You guessed the number in ${attempts} attempt(s).`;
      }

      console.log(message);

      // Call onAttempt callback if provided
      if (typeof config.onAttempt === 'function') {
        config.onAttempt(attempts, guess, guess === randomNumber);
      }

      if (shouldContinue) {
        askQuestion();
      } else {
        rl.close();
        if (typeof config.onSuccess === 'function') {
          config.onSuccess(attempts, randomNumber);
        }
      }
    });
  };

  askQuestion();
}

/**
 * Get game statistics
 * @returns {Object} Game configuration
 */
function getGameInfo() {
  return {
    name: 'Number Guessing Game',
    description: 'Guess the randomly selected number',
    type: 'CLI',
    difficulty: 'Easy',
    players: 1
  };
}

module.exports = { 
  startCliGame,
  getGameInfo
};