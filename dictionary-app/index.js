const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const API_URL = 'https://api.freedictionary.dev/api/v2/entries/en/';

app.use(express.json());

app.get('/define/:word', async (req, res) => {
    const word = req.params.word;
    try {
        const response = await axios.get(`${API_URL}${word}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching definition' });
    }
});

app.listen(port, () => {
    console.log(`Dictionary app is running on http://localhost:${port}`);
});
