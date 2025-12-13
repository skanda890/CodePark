# 🚀 Web-RTC Chat - Enhanced Version

**Advanced Real-time Communication Platform with Video Conferencing, Encrypted Messaging, and File Sharing**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0+-blue.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8+-red.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## ✨ Features

### 🎯 Core Features

✅ **Video & Audio Conferencing**
- Real-time peer-to-peer WebRTC connections
- HD video and audio streaming
- Camera and microphone controls
- Screen sharing capability
- Call quality indicators

✅ **Real-time Messaging**
- Instant text messaging
- Message history (per room)
- Typing indicators
- Message timestamps
- Optional end-to-end encryption (AES-256)
- Message status tracking

✅ **Room Management**
- Create public and private chat rooms
- Password-protected private rooms
- Room participant tracking
- Room-based message history
- Automatic participant updates

✅ **User Management**
- User registration and profiles
- Custom avatars
- Online/offline status tracking
- User presence indicators
- Status update notifications

✅ **File Sharing**
- Share files in chat/rooms
- File metadata tracking
- Secure file transmission
- Sender information

✅ **Security & Privacy**
- End-to-end message encryption (AES-256)
- Password-protected rooms
- Rate limiting (DOS protection)
- CORS configuration
- Input validation

✅ **Modern UI/UX**
- Responsive design (mobile-first)
- Dark/Light theme support
- Smooth animations
- Intuitive controls
- Toast notifications
- Accessibility features

✅ **Call Management**
- Call initiation and answering
- Call history with duration
- Call notifications
- Call quality tracking

✅ **Settings & Preferences**
- Auto-answer toggle
- HD quality preference
- Encryption preference
- Do Not Disturb mode
- Notification settings
- Theme persistence

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- npm v6+
- Modern browser (Chrome, Firefox, Safari, Edge)
- Webcam and microphone

### Installation (3 steps)

```bash
# 1. Navigate to project directory
cd Coding/Languages/JavaScript/web-rtc-chat

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

**Server running at:** `http://localhost:3000`

### First Run

1. Open browser to `http://localhost:3000`
2. Enter your username
3. (Optional) Add avatar URL
4. Click "Join Chat"
5. Allow camera/microphone access
6. Start communicating!

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone https://github.com/skanda890/CodePark.git
cd CodePark/Coding/Languages/JavaScript/web-rtc-chat
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Setup Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 4. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

```env
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment
ENCRYPTION_SECRET=your-secret-key           # Encryption key
CORS_ORIGIN=*                               # CORS settings
```

### STUN Servers (for WebRTC)

Default servers (automatic):
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

### Rate Limiting

```javascript
// 15 minutes window, 100 requests max
windowMs: 15 * 60 * 1000
max: 100
```

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + Express.js
- Socket.IO (real-time communication)
- CryptoJS (encryption)
- express-rate-limit (DOS protection)

**Frontend:**
- Vanilla JavaScript (ES6+)
- WebRTC API
- Socket.IO Client
- Font Awesome Icons
- CSS3 (Flexbox, Grid)

### Directory Structure

```
web-rtc-chat/
├── index.js                 # Backend server
├── package.json            # Dependencies
├── .env.example            # Environment template
├── public/
│   ├── index.html          # Main HTML
│   ├── styles.css          # Styling
│   └── client.js           # Frontend logic
├── FEATURES.md             # Feature documentation
└── README_ENHANCED.md      # This file
```

### Data Flow

```
Client A (Browser)  ←→  [WebRTC/Socket.IO]  ←→  Server  ←→  [WebRTC/Socket.IO]  ←→  Client B (Browser)
         │                                                                                         │
         ├─ Video/Audio Stream (P2P)                                                            │
         ├─ Messages (via Socket.IO)                                                            │
         ├─ User Info (REST API)                                                                │
         └─ Files (via Socket.IO)                                                    ───────────┘
```

---

## 📡 API Documentation

### REST Endpoints

#### Get Rooms
```
GET /api/rooms
Response: { success: true, rooms: [...] }
```

#### Create Room
```
POST /api/create-room
Body: { roomName: "string", isPrivate: boolean, password: "string" }
Response: { success: true, roomId: "string" }
```

#### Get Room Messages
```
GET /api/room/:roomId/messages
Response: { success: true, messages: [...] }
```

#### Get Call History
```
GET /api/call-history
Response: { success: true, callHistory: [...] }
```

### Socket.IO Events

#### User Events
- `register-user` → `user-registered` (emit/receive)
- `get-users` → `users-list` (emit/receive)
- `update-status` → `user-status-updated` (emit/receive)
- `disconnect` → `user-disconnected` (emit/receive)

#### Chat Events
- `send-message` → `new-message` (emit/receive)
- `user-typing` (emit/receive)
- `user-stopped-typing` (emit/receive)

#### Room Events
- `join-room` → `room-updated` (emit/receive)
- `leave-room` → `room-updated` (emit/receive)

#### WebRTC Events
- `offer` (emit/receive)
- `answer` (emit/receive)
- `ice-candidate` (emit/receive)

#### Call Events
- `initiate-call` → `incoming-call` (emit/receive)
- `end-call` → `call-ended` (emit/receive)

#### File Events
- `share-file` → `file-shared` (emit/receive)

---

## 📖 Usage Guide

### 1. Login/Registration

```javascript
// Automatic on page load
// Fill in username and avatar URL
// Click "Join Chat"
```

### 2. Create a Room

```javascript
1. Click "New Room" button in sidebar
2. Enter room name
3. Toggle "Make it Private" (optional)
4. Enter password (if private)
5. Click "Create Room"
6. Room appears in list
```

### 3. Send Messages

```javascript
1. Select a room
2. Type in message input
3. Toggle encryption if needed (🔒)
4. Press Enter or click send
5. Message appears with timestamp
```

### 4. Make a Video Call

```javascript
1. Click phone icon (📞)
2. Grant camera/microphone access
3. Other user receives incoming call
4. They can accept or decline
5. Video conference starts
6. Use controls:
   - 📹 Toggle camera
   - 🎙️ Toggle microphone
   - 📺 Share screen
   - 📞 End call
```

### 5. Share Files

```javascript
1. Click attachment icon (📎)
2. Select file from computer
3. File is shared to room
4. Participants can download
```

### 6. Change Theme

```javascript
1. Click moon/sun icon (🌙/☀️) in header
2. Theme switches to dark/light
3. Preference saved automatically
```

### 7. View Settings

```javascript
1. Click "Settings" in sidebar
2. Toggle preferences:
   - Auto-answer calls
   - HD quality
   - Message encryption
   - Do Not Disturb
   - Notifications
3. Click outside to close
```

---

## 🔧 Troubleshooting

### Camera/Microphone Not Working

```
✅ Solution:
1. Check browser permissions
2. Allow access when prompted
3. Check device connection
4. Test in browser settings
5. Restart browser
```

### No Sound in Calls

```
✅ Solution:
1. Check volume levels
2. Click speaker icon to enable
3. Check system volume
4. Test microphone in browser
5. Try different audio device
```

### Can't Connect to Other User

```
✅ Solution:
1. Check internet connection
2. Verify both on same network/server
3. Check firewall settings
4. Try different browser
5. Restart application
```

### Messages Not Sending

```
✅ Solution:
1. Check Socket.IO connection
2. Verify server is running
3. Check browser console for errors
4. Reload page
5. Check network settings
```

### Server Won't Start

```
✅ Solution:
1. Verify Node.js installed: node -v
2. Verify dependencies: npm install
3. Check port 3000 not in use: lsof -i :3000
4. Check .env file exists
5. Review console errors
```

---

## 🔒 Security Notes

### For Production

1. **Change Encryption Secret**
   ```env
   ENCRYPTION_SECRET=generate-secure-random-key
   ```

2. **Enable HTTPS/WSS**
   ```javascript
   // Use SSL certificates
   const https = require('https')
   ```

3. **Add Authentication**
   - Implement JWT tokens
   - Validate user sessions
   - Protect API routes

4. **Use Database**
   - Replace in-memory storage
   - Persist messages, users, calls
   - Handle scalability

5. **Additional Security**
   - Implement rate limiting per user
   - Add input sanitization
   - Enable CORS properly
   - Use secure cookies

---

## 🤝 Contributing

Contributions welcome!

### Process

```bash
# 1. Fork repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m 'Add amazing feature'

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Open Pull Request
```

### Guidelines
- Follow existing code style
- Add comments for complex logic
- Test thoroughly
- Update documentation
- Describe changes in PR

---

## 📝 License

MIT License © 2025 SkandaBT

Permission is hereby granted to use, modify, and distribute this software.
See LICENSE file for details.

---

## 👨‍💻 Author

**SkandaBT** (@skanda890)
- GitHub: https://github.com/skanda890
- Email: 9980056379Skanda@gmail.com

---

## 📞 Support & Feedback

- **Issues:** Open GitHub issue
- **Discussions:** GitHub discussions
- **Email:** 9980056379Skanda@gmail.com
- **Documentation:** See FEATURES.md

---

## 🗺️ Roadmap

### v2.1 (Planned)
- [ ] Database integration (MongoDB)
- [ ] User authentication (JWT)
- [ ] Message persistence
- [ ] User profiles

### v2.2 (Planned)
- [ ] Group video calls
- [ ] Voice messages
- [ ] Message search
- [ ] Call recording

### v3.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Scalable infrastructure (Redis)

---

## 📚 Resources

- [WebRTC Documentation](https://webrtc.org/)
- [Socket.IO Guide](https://socket.io/docs/)
- [Express.js Docs](https://expressjs.com/)
- [CryptoJS Guide](https://cryptojs.gitbook.io/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Last Updated:** December 13, 2025
**Version:** 2.0.0
**Status:** ✅ Production Ready