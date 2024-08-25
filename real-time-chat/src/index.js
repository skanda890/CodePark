// src/index.js
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('message', (data) => {
  const messages = document.getElementById('messages');
  const message = document.createElement('div');
  message.textContent = data;
  messages.appendChild(message);
});

function sendMessage() {
  const messageInput = document.getElementById('message');
  const message = messageInput.value;
  socket.emit('message', message);
  messageInput.value = ''; // Clear the input field after sending
}

window.sendMessage = sendMessage;
