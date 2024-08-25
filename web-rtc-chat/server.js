const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const httpsOptions = {
  key: fs.readFileSync('./private.key'),
  cert: fs.readFileSync('./certificate.crt')
};
const httpsServer = https.createServer(httpsOptions, app);
const io = socketIo(httpServer); // You can also use socketIo(httpsServer) if needed

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let messageHistory = [];

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send message history to the new client
  socket.emit('messageHistory', messageHistory);

  socket.on('message', (data) => {
    messageHistory.push(data);
    io.emit('message', data);
  });

  socket.on('file', (data) => {
    io.emit('file', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

httpServer.listen(HTTP_PORT, () => console.log(`HTTP server running on port ${HTTP_PORT}`));
httpsServer.listen(HTTPS_PORT, () => console.log(`HTTPS server running on port ${HTTPS_PORT}`));
