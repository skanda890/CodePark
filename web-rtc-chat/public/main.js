const socket = io();

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
remoteVideo.srcObject = newMediaStream;
const peerConnection = new RTCPeerConnection();

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  });

peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

peerConnection.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('ice-candidate', event.candidate);
  }
};

socket.on('ice-candidate', candidate => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('offer', async offer => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async answer => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

async function call() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
}

window.sendMessage = sendMessage;
window.call = call;
