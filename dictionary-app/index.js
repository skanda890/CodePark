const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 5000;

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const TRANSLATE_API_URL = 'https://libretranslate.com/translate';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/define', async (req, res) => {
    const { word, lang } = req.body;
    try {
        // Translate the word to English if it's not already in English
        let translatedWord = word;
        if (lang !== 'en') {
            const translateResponse = await axios.post(TRANSLATE_API_URL, {
                q: word,
                source: lang,
                target: 'en',
                format: 'text'
            });
            translatedWord = translateResponse.data.translatedText;
        }

        // Fetch the definition of the translated word
        const response = await axios.get(`${DICTIONARY_API_URL}${translatedWord}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching definition:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        res.status(500).json({ error: 'Error fetching definition' });
    }
});

app.listen(port, () => {
    console.log(`Dictionary app is running on http://localhost:${port}`);
});
