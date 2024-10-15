const express = require('express');
const axios = require('axios');

const app = express();
const port = 5000;

const openaiApiKey = 'your_openai_api_key';

const generateRiddle = async () => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/engines/davinci-codex/completions',
      {
        prompt: 'Generate a riddle:',
        max_tokens: 50,
        n: 1,
        stop: ['\n'],
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating riddle:', error);
    return 'Could not generate a riddle at this time.';
  }
};

app.get('/riddle', async (req, res) => {
  const riddle = await generateRiddle();
  res.json({ riddle });
});

app.listen(port, () => {
  console.log(`AI Riddle app listening at http://localhost:${port}`);
});
