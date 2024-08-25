const socket = io('https://192.168.1.8:3443'); // Change this to match your server URL and port

socket.on('messageHistory', (messages) => {
  const messagesContainer = document.getElementById('messages');
  messages.forEach((data) => {
    const message = document.createElement('div');
    message.textContent = data;
    messagesContainer.appendChild(message);
  });
});

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

// WebRTC setup
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  });

peerConnection.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', event.candidate);
  }
};

socket.on('ice-candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('offer', async (offer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

async function call() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
}

function sendFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      socket.emit('file', { fileName: file.name, fileData: arrayBuffer });
    };
    reader.readAsArrayBuffer(file);
  }
}

socket.on('file', (data) => {
  const messages = document.getElementById('messages');
  const message = document.createElement('div');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data.fileData]));
  link.download = data.fileName;
  link.textContent = `Download ${data.fileName}`;
  message.appendChild(link);
  messages.appendChild(message);
});

window.sendMessage = sendMessage;
window.call = call;
window.sendFile = sendFile;
