const express = require('express')
const app = express()
const port = 3000

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const randomNumber = Math.floor(Math.random() * 100) + 1
console.log(`The random number is: ${randomNumber}`)

let attempts = 0 // Declare and initialize the attempts variable

console.log('Welcome to the Number Guessing Game!')
console.log(
  'I have selected a random number between 1 and 100. Can you guess it?'
)

const askQuestion = () => {
  rl.question('Enter your guess: ', (answer) => {
    const guess = parseInt(answer, 10)
    attempts += 1

    if (isNaN(guess)) {
      console.log('Please enter a valid number.')
    } else if (guess < randomNumber) {
      console.log('Too low! Try again.')
    } else if (guess > randomNumber) {
      console.log('Too high! Try again.')
    } else {
      console.log(
        `Congratulations! You guessed the number in ${attempts} attempt(s).`
      )
      rl.close()
      return
    }

    askQuestion()
  })
}

askQuestion()
