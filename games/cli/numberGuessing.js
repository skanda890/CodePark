/**
 * Number Guessing CLI Game
 * A simple interactive command-line number guessing game
 * 
 * @module games/cli/numberGuessing
 */

const readline = require('readline');
const gameConfig = require('../config/gameConfig');
const { generateRandomNumber } = require('../utils/gameHelpers');

/**
 * Starts an interactive CLI number guessing game.
 * The game generates a random number between configured min and max,
 * and the player must guess it with feedback provided.
 * 
 * @param {Object} options - Game configuration options
 * @param {number} [options.min] - Minimum number in range (defaults to config)
 * @param {number} [options.max] - Maximum number in range (defaults to config)
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
 *   onSuccess: (attempts, number) => console.log(`Winner in ${attempts}!`),
 *   onAttempt: (attempt, guess) => console.log(`Attempt ${attempt}: ${guess}`)
 * });
 */
function startCliGame(options = {}) {
  // Merge with default configuration
  const config = {
    min: gameConfig.numberGuessing.min,
    max: gameConfig.numberGuessing.max,
    onSuccess: null,
    onAttempt: null,
    ...options
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const randomNumber = generateRandomNumber(config.min, config.max);
  let attempts = 0;

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Welcome to the Number Guessing Game! 🎮     ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\nI have selected a random number between ${config.min} and ${config.max}.`);
  console.log('Can you guess it?\n');

  const askQuestion = () => {
    rl.question('🔢 Enter your guess: ', (answer) => {
      const guess = parseInt(answer, 10);
      attempts++;

      let message;
      let emoji = '';
      let shouldContinue = false;

      if (isNaN(guess)) {
        message = '❌ Please enter a valid number.';
        emoji = '';
        shouldContinue = true;
      } else if (guess < config.min || guess > config.max) {
        message = `❌ Please enter a number between ${config.min} and ${config.max}.`;
        emoji = '';
        shouldContinue = true;
      } else if (guess < randomNumber) {
        const diff = randomNumber - guess;
        if (diff <= 5) {
          message = '📈 Too low! But you\'re very close!';
        } else if (diff <= 10) {
          message = '⬆️  Too low! Getting warmer...';
        } else {
          message = '⬆️  Too low! Try again.';
        }
        shouldContinue = true;
      } else if (guess > randomNumber) {
        const diff = guess - randomNumber;
        if (diff <= 5) {
          message = '📉 Too high! But you\'re very close!';
        } else if (diff <= 10) {
          message = '⬇️  Too high! Getting warmer...';
        } else {
          message = '⬇️  Too high! Try again.';
        }
        shouldContinue = true;
      } else {
        emoji = attempts <= 5 ? '🏆' : attempts <= 10 ? '🎉' : '✅';
        message = `\n${emoji} Congratulations! You guessed the number in ${attempts} attempt(s)!`;
        
        // Performance rating
        if (attempts <= 5) {
          message += '\n💫 Excellent performance!';
        } else if (attempts <= 10) {
          message += '\n👍 Good job!';
        } else if (attempts <= 15) {
          message += '\n😊 Not bad!';
        }
      }

      console.log(message);

      // Call onAttempt callback if provided
      if (typeof config.onAttempt === 'function') {
        config.onAttempt(attempts, guess, guess === randomNumber);
      }

      if (shouldContinue) {
        console.log(`   Attempts so far: ${attempts}\n`);
        askQuestion();
      } else {
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║              Thanks for playing! 🎮            ║');
        console.log('╚════════════════════════════════════════════════╝\n');
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
 * Get game information
 * @returns {Object} Game configuration and metadata
 */
function getGameInfo() {
  return {
    name: 'Number Guessing Game',
    description: 'Guess the randomly selected number between configured range',
    type: 'CLI',
    difficulty: 'Easy',
    players: 1,
    config: {
      min: gameConfig.numberGuessing.min,
      max: gameConfig.numberGuessing.max
    },
    commands: [
      'node index.js --game'
    ]
  };
}

module.exports = { 
  startCliGame,
  getGameInfo
};