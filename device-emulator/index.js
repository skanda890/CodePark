const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Emulate a device
app.post('/emulate', (req, res) => {
    const { deviceType, action } = req.body;

    if (deviceType && action) {
        // Simulate device action
        console.log(`Emulating ${deviceType} performing action: ${action}`);
        res.status(200).send(`Emulated ${deviceType} performing action: ${action}`);
    } else {
        res.status(400).send('Invalid request');
    }
});

app.listen(PORT, () => {
    console.log(`DeviceEmulator running on port ${PORT}`);
});
