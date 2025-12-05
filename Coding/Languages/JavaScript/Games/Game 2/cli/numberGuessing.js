const readline = require('readline');
const gameConfig = require('../config/gameConfig');
const { generateRandomNumber } = require('../utils/gameHelpers');

function startCliGame(options = {}) {
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

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   Welcome to the Number Guessing Game! 🎮     ║');
  console.log('╚══════════════════════════════════════════════════╝');
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
        
        if (attempts <= 5) {
          message += '\n💫 Excellent performance!';
        } else if (attempts <= 10) {
          message += '\n👍 Good job!';
        } else if (attempts <= 15) {
          message += '\n😊 Not bad!';
        }
      }

      console.log(message);

      if (typeof config.onAttempt === 'function') {
        config.onAttempt(attempts, guess, guess === randomNumber);
      }

      if (shouldContinue) {
        console.log(`   Attempts so far: ${attempts}\n`);
        askQuestion();
      } else {
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║              Thanks for playing! 🎮            ║');
        console.log('╚══════════════════════════════════════════════════╝\n');
        rl.close();
        
        if (typeof config.onSuccess === 'function') {
          config.onSuccess(attempts, randomNumber);
        }
      }
    });
  };

  askQuestion();
}

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