const express = require('express');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);
const io = socketIo(httpsServer);

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), (req, res) => {
    res.send('File uploaded successfully');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (msg) => {
        io.emit('message', msg);
    });

    socket.on('signal', (data) => {
        io.emit('signal', data); // Broadcast signal data to all connected clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const host = '192.168.1.3'; // Replace with your local network IP
const port = 443;

httpsServer.listen(port, host, () => {
    console.log(`Server is running on https://${host}:${port}`);
});
