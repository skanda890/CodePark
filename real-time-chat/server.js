const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('message', (data) => {
    console.log('Message received:', data);
    io.emit('message', data);
    sendPushNotification(data);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const sendPushNotification = (message) => {
  const payload = {
    notification: {
      title: 'New Message',
      body: message,
    },
  };

  const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 1 day
  };

  admin.messaging().sendToTopic('chat', payload, options)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
