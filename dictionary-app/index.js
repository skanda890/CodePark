const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 5000;

const API_URL = 'https://api.freedictionary.dev/api/v2/entries/en/';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/define', async (req, res) => {
    const { word } = req.body;
    try {
        const response = await axios.get(`${API_URL}${word}`);
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
