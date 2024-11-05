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

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

httpsServer.listen(443, '192.168.1.10', () => {
  console.log('Server is running on https://192.168.1.5:443');
});
