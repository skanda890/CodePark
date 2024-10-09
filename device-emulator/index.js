const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

let emulatedDevices = [];

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Emulate a device
app.post('/emulate', (req, res) => {
    const { deviceType, action } = req.body;

    if (deviceType && action) {
        // Simulate device action
        const device = { deviceType, action };
        emulatedDevices.push(device);
        console.log(`Emulating ${deviceType} performing action: ${action}`);
        res.status(200).json(device);
    } else {
        res.status(400).send('Invalid request');
    }
});

// Get emulated devices
app.get('/devices', (req, res) => {
    res.status(200).json(emulatedDevices);
});

app.listen(PORT, () => {
    console.log(`DeviceEmulator running on port ${PORT}`);
});
