// Web-RTC Chat Client
class WebRTCChat {
  constructor() {
    this.socket = io()
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.currentUser = null
    this.currentRoom = null
    this.callActive = false
    this.callStartTime = null
    this.encryptMessages = true
    this.theme = localStorage.getItem('theme') || 'light'
    this.initElements()
    this.initEventListeners()
    this.setTheme(this.theme)
    this.initWebRTC()
  }

  initElements() {
    // Auth
    this.loginModal = document.getElementById('login-modal')
    this.loginForm = document.getElementById('login-form')
    this.loginUsername = document.getElementById('login-username')
    this.loginAvatar = document.getElementById('login-avatar')

    // User/Status
    this.userAvatar = document.getElementById('user-avatar')
    this.username = document.getElementById('username')
    this.userStatus = document.getElementById('user-status')
    this.userCount = document.getElementById('user-count')
    this.usersList = document.getElementById('users-list')

    // Chat
    this.messagesContainer = document.getElementById('messages-container')
    this.messageInput = document.getElementById('message-input')
    this.sendBtn = document.getElementById('send-btn')
    this.typingIndicator = document.getElementById('typing-indicator')
    this.chatTitle = document.getElementById('chat-title')

    // Rooms
    this.roomsList = document.getElementById('rooms-list')
    this.createRoomBtn = document.getElementById('create-room-btn')
    this.createRoomModal = document.getElementById('create-room-modal')
    this.createRoomForm = document.getElementById('create-room-form')
    this.roomName = document.getElementById('room-name')
    this.roomPrivate = document.getElementById('room-private')
    this.passwordGroup = document.getElementById('password-group')
    this.roomPassword = document.getElementById('room-password')
    this.cancelRoomBtn = document.getElementById('cancel-room')

    // Video
    this.localVideo = document.getElementById('local-video')
    this.remoteVideo = document.getElementById('remote-video')
    this.noVideoMessage = document.getElementById('no-video-message')
    this.toggleCamera = document.getElementById('toggle-camera')
    this.toggleMicrophone = document.getElementById('toggle-microphone')
    this.toggleSpeaker = document.getElementById('toggle-speaker')
    this.shareScreen = document.getElementById('share-screen')
    this.startCallBtn = document.getElementById('start-call')
    this.endCallBtn = document.getElementById('end-call')
    this.callInfo = document.getElementById('call-info')
    this.callDuration = document.getElementById('call-duration')

    // UI Controls
    this.themeToggle = document.getElementById('theme-toggle')
    this.settingsBtn = document.getElementById('settings-btn')
    this.settingsModal = document.getElementById('settings-modal')
    this.closeSettingsBtn = document.getElementById('close-settings')
    this.callHistoryBtn = document.getElementById('call-history-btn')
    this.callHistoryModal = document.getElementById('call-history-modal')
    this.closeHistoryBtn = document.getElementById('close-history')
    this.historyList = document.getElementById('history-list')
    this.encryptToggle = document.getElementById('encrypt-toggle')
    this.fileBtn = document.getElementById('file-btn')
    this.fileInput = document.getElementById('file-input')
    this.emojiBtn = document.getElementById('emoji-btn')

    // Participants
    this.participantsPanel = document.getElementById('participants-panel')
    this.toggleParticipantsBtn = document.getElementById('toggle-participants')
    this.closeParticipantsBtn = document.getElementById('close-participants')
    this.participantsList = document.getElementById('participants-list')
    this.participantCount = document.getElementById('participant-count')

    // Notifications
    this.notificationToast = document.getElementById('notification-toast')
  }

  initEventListeners() {
    // Auth
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e))

    // Chat
    this.sendBtn.addEventListener('click', () => this.sendMessage())
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })
    this.messageInput.addEventListener('input', () => this.handleTyping())

    // Rooms
    this.createRoomBtn.addEventListener('click', () => this.openCreateRoomModal())
    this.createRoomForm.addEventListener('submit', (e) => this.handleCreateRoom(e))
    this.cancelRoomBtn.addEventListener('click', () => this.closeCreateRoomModal())
    this.roomPrivate.addEventListener('change', () => {
      this.passwordGroup.classList.toggle('hidden')
    })

    // Video
    this.toggleCamera.addEventListener('click', () => this.toggleCameraStream())
    this.toggleMicrophone.addEventListener('click', () => this.toggleMicrophoneStream())
    this.shareScreen.addEventListener('click', () => this.shareScreenStream())
    this.startCallBtn.addEventListener('click', () => this.initiateCall())
    this.endCallBtn.addEventListener('click', () => this.endCall())

    // UI
    this.themeToggle.addEventListener('click', () => this.toggleTheme())
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal())
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal())
    this.callHistoryBtn.addEventListener('click', () => this.openCallHistoryModal())
    this.closeHistoryBtn.addEventListener('click', () => this.closeCallHistoryModal())
    this.encryptToggle.addEventListener('click', () => this.toggleEncryption())
    this.fileBtn.addEventListener('click', () => this.fileInput.click())
    this.fileInput.addEventListener('change', (e) => this.handleFileShare(e))

    // Participants
    this.toggleParticipantsBtn.addEventListener('click', () => this.toggleParticipantsPanel())
    this.closeParticipantsBtn.addEventListener('click', () => this.closeParticipantsPanel())
  }

  // Authentication
  handleLogin(e) {
    e.preventDefault()
    const username = this.loginUsername.value.trim()
    const avatar = this.loginAvatar.value.trim()

    if (!username) {
      this.showNotification('Please enter a username', 'error')
      return
    }

    this.currentUser = { username, avatar }
    this.userAvatar.src = avatar
    this.username.textContent = username
    this.loginModal.classList.add('hidden')

    this.socket.emit('register-user', { username, avatar })
    this.loadRooms()
    this.startLocalStream()
  }

  // WebRTC Initialization
  async initWebRTC() {
    try {
      const config = {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] }
        ]
      }
      this.peerConnection = new RTCPeerConnection(config)

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', event.candidate)
        }
      }

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        this.remoteVideo.srcObject = this.remoteStream
        this.noVideoMessage.classList.add('hidden')
      }

      this.socket.on('offer', async (data) => {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await this.peerConnection.createAnswer()
          await this.peerConnection.setLocalDescription(answer)
          this.socket.emit('answer', answer)
        } catch (error) {
          console.error('Error handling offer:', error)
        }
      })

      this.socket.on('answer', async (data) => {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        } catch (error) {
          console.error('Error handling answer:', error)
        }
      })

      this.socket.on('ice-candidate', async (data) => {
        try {
          if (data.candidate) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      })
    } catch (error) {
      console.error('WebRTC initialization error:', error)
      this.showNotification('Failed to initialize WebRTC', 'error')
    }
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      this.localVideo.srcObject = this.localStream

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream)
      })
    } catch (error) {
      console.error('Error accessing media devices:', error)
      this.showNotification('Unable to access camera/microphone', 'error')
    }
  }

  toggleCameraStream() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
        this.toggleCamera.classList.toggle('active')
      })
    }
  }

  toggleMicrophoneStream() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
        this.toggleMicrophone.classList.toggle('active')
      })
    }
  }

  async shareScreenStream() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]

      const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) {
        await sender.replaceTrack(screenTrack)
        screenTrack.onended = async () => {
          const videoTrack = this.localStream.getVideoTracks()[0]
          await sender.replaceTrack(videoTrack)
        }
        this.showNotification('Screen sharing started', 'success')
      }
    } catch (error) {
      console.error('Error sharing screen:', error)
      this.showNotification('Failed to share screen', 'error')
    }
  }

  async initiateCall() {
    try {
      if (!this.peerConnection) {
        await this.initWebRTC()
      }

      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      this.socket.emit('offer', offer)
      this.callActive = true
      this.callStartTime = Date.now()
      this.startCallBtn.classList.add('hidden')
      this.endCallBtn.classList.remove('hidden')
      this.callInfo.classList.remove('hidden')
      this.startCallDurationTimer()
      this.showNotification('Call initiated', 'success')
    } catch (error) {
      console.error('Error initiating call:', error)
      this.showNotification('Failed to initiate call', 'error')
    }
  }

  endCall() {
    try {
      if (this.peerConnection) {
        this.peerConnection.getSenders().forEach((sender) => {
          sender.track?.stop()
        })
        this.peerConnection.close()
        this.peerConnection = null
      }

      this.callActive = false
      this.startCallBtn.classList.remove('hidden')
      this.endCallBtn.classList.add('hidden')
      this.callInfo.classList.add('hidden')
      this.noVideoMessage.classList.remove('hidden')
      this.remoteVideo.srcObject = null

      const duration = Math.floor((Date.now() - (this.callStartTime || Date.now())) / 1000)
      this.socket.emit('end-call', { callId: 'call_' + Date.now(), duration })
      this.showNotification('Call ended', 'success')
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  startCallDurationTimer() {
    const updateDuration = () => {
      if (this.callActive && this.callStartTime) {
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000)
        const minutes = Math.floor(elapsed / 60)
        const seconds = elapsed % 60
        this.callDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        setTimeout(updateDuration, 1000)
      }
    }
    updateDuration()
  }

  // Chat Functions
  sendMessage() {
    const content = this.messageInput.value.trim()
    if (!content) return

    const message = {
      content,
      encrypted: this.encryptMessages,
      timestamp: new Date()
    }

    this.socket.emit('send-message', message)
    this.messageInput.value = ''
    this.socket.emit('user-stopped-typing')
  }

  displayMessage(message) {
    const messageEl = document.createElement('div')
    messageEl.className = message.senderId === this.currentUser?.username ? 'message own' : 'message'

    const content = message.encryptedContent ? '🔒 Encrypted Message' : message.content
    const time = new Date(message.timestamp).toLocaleTimeString()

    messageEl.innerHTML = `
      <div class="message-content">
        ${content}
        <div class="message-time">${time}</div>
      </div>
    `

    this.messagesContainer.appendChild(messageEl)
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
  }

  handleTyping() {
    if (this.messageInput.value) {
      this.socket.emit('user-typing')
    }
  }

  // Room Functions
  async loadRooms() {
    try {
      const response = await fetch('/api/rooms')
      const data = await response.json()

      this.roomsList.innerHTML = ''
      data.rooms.forEach((room) => {
        const roomEl = document.createElement('div')
        roomEl.className = 'room-item'
        roomEl.innerHTML = `
          <i class="fas fa-door-open"></i>
          <span>${room.name}</span>
          <span style="font-size: 0.7rem">(${room.participantCount})</span>
        `
        roomEl.addEventListener('click', () => this.joinRoom(room.id))
        this.roomsList.appendChild(roomEl)
      })
    } catch (error) {
      console.error('Error loading rooms:', error)
    }
  }

  openCreateRoomModal() {
    this.createRoomModal.classList.remove('hidden')
  }

  closeCreateRoomModal() {
    this.createRoomModal.classList.add('hidden')
    this.createRoomForm.reset()
  }

  async handleCreateRoom(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: this.roomName.value,
          isPrivate: this.roomPrivate.checked,
          password: this.roomPassword.value || null
        })
      })
      const data = await response.json()
      if (data.success) {
        this.showNotification('Room created successfully', 'success')
        this.closeCreateRoomModal()
        this.loadRooms()
        this.joinRoom(data.roomId)
      }
    } catch (error) {
      console.error('Error creating room:', error)
      this.showNotification('Failed to create room', 'error')
    }
  }

  joinRoom(roomId) {
    this.currentRoom = roomId
    this.socket.emit('join-room', { roomId })
    this.chatTitle.textContent = `Room ${roomId.substring(0, 8)}`
    this.messagesContainer.innerHTML = ''
    this.loadRoomMessages(roomId)
  }

  async loadRoomMessages(roomId) {
    try {
      const response = await fetch(`/api/room/${roomId}/messages`)
      const data = await response.json()
      data.messages.forEach((msg) => this.displayMessage(msg))
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // File Sharing
  handleFileShare(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      this.socket.emit('share-file', {
        name: file.name,
        size: file.size,
        type: file.type,
        data: event.target.result
      })
      this.showNotification(`File "${file.name}" shared`, 'success')
    }
    reader.readAsArrayBuffer(file)
  }

  // User Management
  loadUsers() {
    this.socket.emit('get-users')
  }

  updateUsersList(users) {
    this.userCount.textContent = users.length
    this.usersList.innerHTML = ''
    users.forEach((user) => {
      const userEl = document.createElement('div')
      userEl.className = 'user-item'
      userEl.innerHTML = `
        <img src="${user.avatar}" alt="${user.username}" class="avatar" style="width: 24px; height: 24px;">
        <span>${user.username}</span>
        <span class="status-badge ${user.status === 'online' ? 'online' : 'offline'}" style="margin-left: auto;">${user.status}</span>
      `
      this.usersList.appendChild(userEl)
    })
  }

  // Encryption Toggle
  toggleEncryption() {
    this.encryptMessages = !this.encryptMessages
    this.encryptToggle.classList.toggle('active')
    const status = this.encryptMessages ? 'enabled' : 'disabled'
    this.showNotification(`Encryption ${status}`, 'success')
  }

  // Theme Toggle
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
    this.setTheme(this.theme)
    localStorage.setItem('theme', this.theme)
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    const icon = this.themeToggle.querySelector('i')
    icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon'
  }

  // Modals
  openSettingsModal() {
    this.settingsModal.classList.remove('hidden')
  }

  closeSettingsModal() {
    this.settingsModal.classList.add('hidden')
  }

  async openCallHistoryModal() {
    try {
      const response = await fetch('/api/call-history')
      const data = await response.json()
      this.historyList.innerHTML = ''
      data.callHistory.forEach((call) => {
        const historyEl = document.createElement('div')
        historyEl.className = 'history-item'
        historyEl.innerHTML = `
          <div class="history-item-header">
            <span class="history-item-name">${call.fromName || 'Unknown'}</span>
            <span class="history-item-time">${new Date(call.initiatedAt).toLocaleString()}</span>
          </div>
          <div class="history-item-duration">Duration: ${call.duration}s</div>
        `
        this.historyList.appendChild(historyEl)
      })
      this.callHistoryModal.classList.remove('hidden')
    } catch (error) {
      console.error('Error loading call history:', error)
    }
  }

  closeCallHistoryModal() {
    this.callHistoryModal.classList.add('hidden')
  }

  // Participants Panel
  toggleParticipantsPanel() {
    this.participantsPanel.classList.toggle('hidden')
  }

  closeParticipantsPanel() {
    this.participantsPanel.classList.add('hidden')
  }

  updateParticipants(participants) {
    this.participantCount.textContent = participants.length
    this.participantsList.innerHTML = ''
    participants.forEach((participant) => {
      const participantEl = document.createElement('div')
      participantEl.className = 'participant-item'
      participantEl.innerHTML = `
        <img src="${participant.avatar || 'https://via.placeholder.com/40'}" alt="${participant.username}" class="avatar">
        <div class="participant-info">
          <div class="participant-name">${participant.username}</div>
          <div class="participant-status">Joined at ${new Date(participant.joinedAt).toLocaleTimeString()}</div>
        </div>
      `
      this.participantsList.appendChild(participantEl)
    })
  }

  // Notifications
  showNotification(message, type = 'success') {
    this.notificationToast.textContent = message
    this.notificationToast.className = `notification-toast ${type}`
    this.notificationToast.classList.remove('hidden')

    setTimeout(() => {
      this.notificationToast.classList.add('hidden')
    }, 3000)
  }

  // Socket Event Listeners
  setupSocketListeners() {
    this.socket.on('user-registered', (data) => {
      this.showNotification(`${data.username} joined (${data.totalUsers} online)`, 'success')
    })

    this.socket.on('new-message', (message) => {
      this.displayMessage(message)
    })

    this.socket.on('users-list', (users) => {
      this.updateUsersList(users)
    })

    this.socket.on('room-updated', (data) => {
      this.updateParticipants(data.participants)
    })

    this.socket.on('user-typing', (data) => {
      this.typingIndicator.classList.remove('hidden')
    })

    this.socket.on('user-stopped-typing', () => {
      this.typingIndicator.classList.add('hidden')
    })

    this.socket.on('error', (error) => {
      this.showNotification(error.message || 'An error occurred', 'error')
    })

    this.socket.on('user-disconnected', (data) => {
      this.showNotification(`${data.username} left (${data.totalUsers} online)`, 'warning')
    })
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const chat = new WebRTCChat()
  chat.setupSocketListeners()
})