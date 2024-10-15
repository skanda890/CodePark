const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 5000;

const openaiApiKey = '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';

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
    return null;
  }
};

app.get('/riddle', async (req, res) => {
  const riddle = await generateRiddle();
  if (riddle) {
    res.json({ riddle });
  } else {
    res.json({ riddle: 'Could not generate a riddle at this time. Please try again later.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`AI Riddle app listening at http://localhost:${port}`);
});
