const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
