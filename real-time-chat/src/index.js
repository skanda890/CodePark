import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('message', (data) => {
  console.log('Message received:', data);
  const messages = document.getElementById('messages');
  const message = document.createElement('div');
  message.textContent = data;
  messages.appendChild(message);
});

function sendMessage() {
  const messageInput = document.getElementById('message');
  const message = messageInput.value;
  console.log('Sending message:', message);
  socket.emit('message', message);
  messageInput.value = ''; // Clear the input field after sending
}

window.sendMessage = sendMessage;
