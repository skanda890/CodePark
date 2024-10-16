require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.API_KEY;
const url = `https://api.google.com/gemini/v1/riddles?apikey=${apiKey}`;

axios.get(url)
  .then(response => {
    const riddle = response.data.riddle;
    console.log(`Here's a riddle for you: ${riddle}`);
  })
  .catch(error => {
    console.error('Error generating the riddle:', error);
  });
