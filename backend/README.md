# Web-RTC Chat Backend - v2.1.0

**Production-Ready Chat Application with Real-Time Communication, Authentication, and Persistence**

---

## 🚀 Overview

This is a comprehensive Node.js/Express backend for a Web-RTC chat application with the following features:

- ✅ **User Authentication** - JWT + OAuth2 (Google/GitHub)
- ✅ **Message Persistence** - MongoDB with full history
- ✅ **Real-Time Communication** - Socket.IO for instant messaging
- ✅ **User Profiles** - Rich profile customization
- ✅ **Security** - Bcrypt, rate limiting, input validation
- ✅ **Scalability** - Connection pooling, caching ready
- ✅ **Video/Audio** - WebRTC signaling (client-side)

---

## 📄 Quick Start

### Prerequisites

```bash
# Required
Node.js >= 14
MongoDB >= 4.4
npm >= 6

# Optional
Redis (for caching)
AWS S3 (for file storage)
```

### Installation

```bash
# 1. Clone and navigate
git clone <repo>
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Start server
npm run dev  # Development with hot reload
npm start    # Production
```

### Environment Configuration

```bash
# .env file
NODE_ENV=development
PORT=3000
HOST=localhost

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webrtc-chat

# JWT
JWT_SECRET=<32-char-random-string>
JWT_REFRESH_SECRET=<32-char-random-string>
JWT_EXPIRY=15m

# OAuth (optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-secret>

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## 🔑 Authentication

### User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "...",
    "status": "offline",
    "createdAt": "2025-12-13T09:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User

```bash
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:3000/api/auth/me
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGc..."}'
```

### Logout

```bash
curl -X POST -H "Authorization: Bearer <accessToken>" \
  http://localhost:3000/api/auth/logout
```

---

## 📱 Messages API

### Send Message (Socket.IO)

```javascript
socket.emit("send_message", {
  roomId: "507f1f77bcf86cd799439011",
  content: "Hello everyone!",
  encrypted: false,
  fileAttachment: null,
});

// Receive response
socket.on("message_sent", (message) => {
  console.log("Message sent:", message);
});
```

### Get Message History

```bash
curl -H "Authorization: Bearer <token>" \
  'http://localhost:3000/api/messages?roomId=...&page=1'
```

### Mark Message as Read

```javascript
socket.emit("mark_message_read", messageId);
```

### Add Reaction

```javascript
socket.emit("add_reaction", {
  messageId: "...",
  emoji: "😀",
});
```

### Edit Message

```javascript
socket.emit("edit_message", {
  messageId: "...",
  content: "Updated content",
});
```

### Delete Message

```javascript
socket.emit("delete_message", messageId);
```

---

## 👥 Users API

### Update Profile

```bash
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Software developer from India",
    "location": "Bengaluru",
    "website": "https://example.com"
  }' \
  http://localhost:3000/api/auth/profile
```

### Change Password

```bash
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }' \
  http://localhost:3000/api/auth/password
```

### Block User

```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/auth/block/507f1f77bcf86cd799439011
```

### Unblock User

```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/auth/block/507f1f77bcf86cd799439011
```

---

## 📄 Socket.IO Events

### Connection

```javascript
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

### Rooms

```javascript
// Join room
socket.emit("join_room", { roomId: "..." });

// Receive message history
socket.on("message_history", (messages) => {
  console.log("History:", messages);
});

// Leave room
socket.emit("leave_room", { roomId: "..." });
```

### Typing Indicators

```javascript
// Emit typing
socket.emit("user_typing", { roomId: "...", username: "john" });

// Receive typing
socket.on("user_typing", ({ userId, username }) => {
  console.log(`${username} is typing...`);
});
```

### User Status

```javascript
// Set status
socket.emit("set_status", { status: "away", customStatus: "In a meeting" });

// Receive status update
socket.on("user_status_changed", ({ userId, status }) => {
  console.log(`User ${userId} is now ${status}`);
});
```

### Calls (WebRTC Signaling)

```javascript
// Initiate call
socket.emit("call_user", {
  targetUserId: "...",
  roomId: "...",
  callType: "video", // or 'audio'
});

// Receive call
socket.on("incoming_call", ({ callerId, callerName, callType }) => {
  console.log(`Incoming ${callType} call from ${callerName}`);
});

// Send offer
socket.emit("webrtc_offer", {
  targetUserId: "...",
  offer: rtcPeerConnection.localDescription,
});

// Receive offer
socket.on("webrtc_offer", async ({ offer, senderId }) => {
  await rtcPeerConnection.setRemoteDescription(
    new RTCSessionDescription(offer),
  );
  // ... create and send answer
});

// ICE Candidates
socket.emit("ice_candidate", {
  targetUserId: "...",
  candidate: rtcPeerConnection.currentLocalDescription,
});

socket.on("ice_candidate", ({ candidate }) => {
  rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
```

---

## 💾 Database Schemas

### User Schema

```javascript
{
  // Auth
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String,
  oauthProvider: 'local' | 'google' | 'github',

  // Profile
  avatar: String,
  bio: String,
  location: String,
  website: String,

  // Status
  status: 'online' | 'offline' | 'away' | 'dnd',
  customStatus: String,
  lastSeen: Date,

  // Settings
  settings: {
    theme: 'light' | 'dark',
    notifications: Boolean,
    encryption: Boolean
  },

  // Security
  blockedUsers: [ObjectId],

  // Metadata
  createdAt: Date,
  isPremium: Boolean
}
```

### Message Schema

```javascript
{
  roomId: ObjectId (ref: Room),
  senderId: ObjectId (ref: User),
  content: String,
  messageType: 'text' | 'image' | 'file' | 'voice' | 'video',
  encrypted: Boolean,

  // Attachments
  fileAttachment: {
    fileId: ObjectId,
    fileName: String,
    fileSize: Number,
    fileUrl: String
  },

  // Interactions
  readBy: [{ userId: ObjectId, readAt: Date }],
  reactions: [{ emoji: String, userId: ObjectId }],

  // Editing
  editedAt: Date,
  editHistory: [{ content: String, editedAt: Date }],

  // Deletion
  isDeleted: Boolean,
  deletedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Features

### Password Security

- Bcrypt hashing (10 rounds)
- Minimum 8 characters
- Requires uppercase, lowercase, number, special char
- Password reset flow available

### Token Security

- JWT with expiry (15 minutes)
- Refresh token strategy (7 days)
- HTTP-only cookies
- Token blacklisting on logout

### Rate Limiting

- 5 auth attempts per 15 minutes
- Configurable per endpoint
- Based on IP or user ID

### Input Validation

- Joi schema validation
- XSS prevention
- SQL injection protection (Mongoose)
- CSRF token support

### CORS Configuration

```javascript
{
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}
```

---

## 🐛 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- auth.test.js

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Manual Testing

```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# Check MongoDB
mongo
> use webrtc-chat
> db.users.find()
```

---

## 📒 File Structure

```
backend/
├── models/                      # Database schemas
│  ├── User.js
│  ├── Message.js
│  ├── Room.js
│  └── Call.js
├── routes/                      # API endpoints
│  ├── auth.js
│  ├── messages.js
│  ├── users.js
│  └── calls.js
├── middleware/                  # Custom middleware
│  ├── auth.js
│  ├── validation.js
│  └── upload.js
├── services/                    # Business logic
│  ├── database.js
│  ├── s3Service.js
│  └── emailService.js
├── config/                      # Configuration
│  ├── database.js
│  ├── socket.js
│  └── constants.js
├── tests/                       # Test files
├── .env.example
├── package.json
├── index.js                      # Entry point
└── README.md
```

---

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t webrtc-chat .
docker run -p 3000:3000 --env-file .env webrtc-chat
```

### Heroku

```bash
heroku login
heroku create webrtc-chat-app
heroku addons:create mongolab:sandbox
git push heroku main
```

### AWS EC2

```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Install Node & PM2
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
sudo npm install -g pm2

# Clone and start
git clone <repo>
cd webrtc-chat/backend
npm install
pm2 start index.js --name "webrtc-chat"
```

---

## 📁 Dependencies

**Core:**

- `express` - Web framework
- `socket.io` - Real-time communication
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `passport` - OAuth strategy

**Utilities:**

- `joi` - Input validation
- `multer` - File upload
- `dotenv` - Environment variables
- `cors` - Cross-origin requests
- `compression` - Response compression

**Optional:**

- `redis` - Caching
- `mediasoup` - SFU for group calls
- `aws-sdk` - AWS services

---

## 💡 Best Practices

1. **Always use HTTPS** in production
2. **Never commit .env** file
3. **Validate all inputs** with Joi
4. **Use rate limiting** on sensitive endpoints
5. **Keep dependencies updated** - `npm audit`
6. **Monitor error logs** - Use Sentry/Datadog
7. **Backup MongoDB** - Daily automated backups
8. **Use environment variables** - No hardcoded values

---

## 📀 License

MIT License - see LICENSE file

---

## 🙋 Support

For issues, questions, or contributions:

- GitHub Issues: [CodePark/issues](https://github.com/skanda890/CodePark/issues)
- Email: skanda890@example.com

---

**Version:** 2.1.0  
**Last Updated:** December 13, 2025  
**Status:** Production Ready 🚀
