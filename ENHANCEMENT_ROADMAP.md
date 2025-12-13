# 🚀 Web-RTC Chat Enhancement Roadmap

**Version:** 2.1.0 - Production Ready
**Status:** In Development
**Last Updated:** December 13, 2025

---

## 📋 Executive Summary

This document outlines the complete implementation roadmap for 10 major feature enhancements to transform the Web-RTC Chat application from a feature-rich prototype into a **production-grade communication platform**.

### Enhancement Phases

| Phase | Features | Timeline |
|-------|----------|----------|
| **Phase 1** | Database + Authentication + Persistence | Weeks 1-2 |
| **Phase 2** | Advanced Messaging & Search | Week 3 |
| **Phase 3** | Group Calls & Voice Messages | Week 4 |
| **Phase 4** | Recording & Mobile + Analytics | Week 5 |

---

## 🔄 Phase 1: Foundation (Database, Auth, Persistence)

### 1. Database Integration (MongoDB)

**Objective:** Replace in-memory storage with persistent MongoDB database

**Implementation Details:**

```
Architecture:
├─ MongoDB Collections
│  ├─ users (authentication, profiles, settings)
│  ├─ rooms (room data, metadata)
│  ├─ messages (chat history, encryption metadata)
│  ├─ calls (call history, duration, participants)
│  ├─ files (file metadata, storage references)
│  └─ sessions (active connections, presence)
│
├─ Mongoose Schemas
│  ├─ User (validation, indexes)
│  ├─ Room (access control)
│  ├─ Message (timestamps, encryption)
│  ├─ Call (metadata, recording links)
│  └─ File (storage paths)
│
└─ Connection Management
   ├─ Connection pooling
   ├─ Reconnection logic
   ├─ Transaction support
   └─ Backup strategy
```

**Dependencies:**
```json
{
  "mongodb": "^5.8.0",
  "mongoose": "^8.0.0",
  "mongoose-encryption": "^2.1.2"
}
```

**Key Schema Examples:**

```javascript
// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: null },
  status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  settings: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true },
    encryption: { type: Boolean, default: false },
    dnd: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  encrypted: { type: Boolean, default: false },
  encryptionMetadata: { type: String, default: null },
  fileAttachment: {
    fileId: mongoose.Schema.Types.ObjectId,
    fileName: String,
    fileSize: Number
  },
  readBy: [{ userId: mongoose.Schema.Types.ObjectId, readAt: Date }],
  reactions: [{ emoji: String, userId: mongoose.Schema.Types.ObjectId }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});
```

**Implementation Steps:**

1. **Setup MongoDB Connection**
   - Configure connection string (Atlas or local)
   - Implement connection pooling
   - Add reconnection logic
   - Monitor connection status

2. **Create Mongoose Schemas**
   - Define all collections
   - Add indexes for performance
   - Implement validation
   - Setup encryption for sensitive fields

3. **Migrate Data**
   - Export existing in-memory data
   - Import to MongoDB
   - Verify data integrity
   - Cleanup old format

4. **Add Database Middleware**
   - Connection lifecycle management
   - Error handling
   - Logging
   - Performance monitoring

---

### 2. User Authentication (JWT/OAuth)

**Objective:** Implement secure authentication with JWT tokens and OAuth2 support

**Authentication Flow:**

```
User Registration/Login
    ↓
Credential Validation
    ↓
Generate JWT Token
    ↓
Store in HTTP-Only Cookie
    ↓
Include in Socket.IO Handshake
    ↓
Verify on Protected Routes
```

**Dependencies:**
```json
{
  "jsonwebtoken": "^9.1.0",
  "bcryptjs": "^2.4.3",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-github": "^1.1.0",
  "express-session": "^1.17.3",
  "dotenv": "^16.3.1"
}
```

**Implementation:**

```javascript
// JWT Token Generation
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Middleware: Verify JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Socket.IO Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);
    
    // Create user
    const user = new User({
      username,
      email,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Set HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    
    res.json({
      success: true,
      user: { id: user._id, username, email, avatar: user.avatar }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OAuth2 Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: profile.photos[0]?.value || null,
        passwordHash: null
      });
      await user.save();
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// OAuth Callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user._id);
    
    res.cookie('accessToken', accessToken, { httpOnly: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    
    res.redirect('/');
  }
);
```

**Key Features:**

- ✅ JWT token with 15-minute expiry
- ✅ Refresh token strategy
- ✅ HTTP-only cookies (CSRF protection)
- ✅ OAuth2 with Google/GitHub
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on auth endpoints
- ✅ Token refresh endpoint
- ✅ Logout with token blacklist

---

### 3. Message Persistence

**Objective:** Persist all messages to MongoDB with efficient querying

**Database Strategy:**

```javascript
// Message indexing for performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, encrypted: 1 });
messageSchema.index({ content: 'text' }); // For full-text search

// Batch message fetching
const fetchMessages = async (roomId, page = 1, pageSize = 50) => {
  const skip = (page - 1) * pageSize;
  
  const messages = await Message.find({ roomId })
    .populate('senderId', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();
  
  return messages.reverse();
};

// Socket.IO message save
socket.on('send_message', async (data) => {
  try {
    const message = new Message({
      roomId: data.roomId,
      senderId: socket.userId,
      content: data.content,
      encrypted: data.encrypted
    });
    
    await message.save();
    
    // Populate and broadcast
    await message.populate('senderId', 'username avatar');
    io.to(data.roomId).emit('receive_message', message);
    
  } catch (error) {
    socket.emit('message_error', { error: error.message });
  }
});

// Load history on room join
socket.on('join_room', async (roomId) => {
  const messages = await fetchMessages(roomId, 1, 50);
  socket.emit('message_history', messages);
});
```

**Features:**

- ✅ Automatic message indexing
- ✅ Pagination support (50 messages per page)
- ✅ Sender information population
- ✅ Timestamp tracking
- ✅ Efficient querying
- ✅ Read receipt tracking
- ✅ Message reactions support

---

## 🎭 Phase 2: User Profiles & Customization

### 4. User Profiles and Customization

**Objective:** Enable rich user profiles with customization options

**Profile Features:**

```javascript
// Extended User Schema
const userProfileSchema = {
  // Basic Info
  username: String,
  email: String,
  avatar: String,
  
  // Profile
  bio: String,
  location: String,
  website: String,
  phoneNumber: String,
  dateOfBirth: Date,
  
  // Customization
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
  accentColor: String,
  notification: {
    email: Boolean,
    push: Boolean,
    soundEnabled: Boolean,
    doNotDisturb: Boolean,
    dndSchedule: { start: String, end: String }
  },
  
  // Privacy
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
  blockedUsers: [mongoose.Schema.Types.ObjectId],
  allowCallsFrom: { type: String, enum: ['everyone', 'friends', 'nobody'], default: 'everyone' },
  
  // Status
  status: { type: String, enum: ['online', 'offline', 'away', 'dnd'], default: 'offline' },
  customStatus: String,
  statusExpiresAt: Date
};

// Profile API Endpoints
app.get('/api/users/:userId/profile', async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select('-passwordHash -email -phoneNumber');
  res.json(user);
});

app.put('/api/users/profile', verifyToken, async (req, res) => {
  const { bio, location, website, theme, accentColor } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      bio,
      location,
      website,
      settings: { theme, accentColor }
    },
    { new: true }
  );
  
  res.json(user);
});

// Avatar Upload (with AWS S3)
app.post('/api/users/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  const avatarUrl = await uploadToS3(req.file);
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    { avatar: avatarUrl },
    { new: true }
  );
  
  res.json({ avatar: user.avatar });
});

// Custom Status
socket.on('set_status', async (status) => {
  const user = await User.findByIdAndUpdate(
    socket.userId,
    {
      customStatus: status.text,
      statusExpiresAt: status.expiresAt
    },
    { new: true }
  );
  
  io.emit('user_status_changed', {
    userId: socket.userId,
    status: user.customStatus
  });
});

// Block/Unblock User
app.post('/api/users/:userId/block', verifyToken, async (req, res) => {
  await User.findByIdAndUpdate(
    req.userId,
    { $addToSet: { blockedUsers: req.params.userId } }
  );
  res.json({ blocked: true });
});
```

**Profile Features:**

- ✅ Rich profile information
- ✅ Avatar upload & CDN storage
- ✅ Theme customization
- ✅ Custom status with expiry
- ✅ Privacy controls
- ✅ User blocking
- ✅ Notification preferences
- ✅ Do Not Disturb scheduling

---

## 📞 Phase 2 Continued: Advanced Calling Features

### 5. Group Video Calls (SFU/Mesh Architecture)

**Objective:** Enable scalable group video calls using SFU (Selective Forwarding Unit)

**Architecture Comparison:**

```
Mesh Network:
User1 ──────── User2
  ├─────────────┤
  │             │
User3 ─────────┘

Pros: No server processing needed
Cons: High bandwidth, poor scalability (max 4-6 users)

────────────────────────────────────

SFU (Recommended for Production):
User1 ─┐
User2 ─┼─────── SFU Server ─────── Broadcast to All
User3 ─┤
User4 ─┘

Pros: Scalable to 100+ users, lower bandwidth
Cons: Server processing required
```

**Implementation with MediaSoup SFU:**

```json
{
  "mediasoup": "^3.10.0",
  "mediasoup-client": "^5.0.0",
  "express-async-errors": "^3.1.1"
}
```

**Backend Implementation:**

```javascript
const mediasoup = require('mediasoup');

let router; // Mediasoup router instance

// Create Mediasoup Router
const createRouter = async () => {
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      }
    ]
  });
  return router;
};

// WebRTC Transport (for producer/consumer)
socket.on('createWebRtcTransport', async (_, callback) => {
  try {
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: ANNOUNCED_IP }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true
    });

    callback({
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
      }
    });

    // Handle transport connection
    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') transport.close();
    });

  } catch (error) {
    callback({ error: error.message });
  }
});

// Produce Audio/Video
socket.on('produce', async (data, callback) => {
  try {
    let transport = transports.get(data.transportId);
    
    const producer = await transport.produce({
      kind: data.kind,
      rtpParameters: data.rtpParameters
    });

    producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      producer.close();
      producers.delete(producer.id);
    });

    callback({ id: producer.id });

    // Notify others of new producer
    socket.broadcast.emit('newProducer', {
      producerId: producer.id,
      kind: data.kind,
      userId: socket.userId
    });

  } catch (error) {
    callback({ error: error.message });
  }
});

// Consume Producer Feed
socket.on('consume', async (data, callback) => {
  try {
    const producer = producers.get(data.producerId);
    
    if (!producer) {
      return callback({ error: 'Producer not found' });
    }

    const transport = transports.get(data.transportId);
    
    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: data.rtpCapabilities,
      paused: true
    });

    consumers.set(consumer.id, consumer);

    callback({
      id: consumer.id,
      producerId: producer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters
    });

  } catch (error) {
    callback({ error: error.message });
  }
});

// Resume Consumer (start receiving stream)
socket.on('resume', async (consumerId, callback) => {
  const consumer = consumers.get(consumerId);
  if (consumer) {
    await consumer.resume();
    callback({ success: true });
  }
});
```

**Frontend Implementation:**

```javascript
class GroupVideoCall {
  constructor(roomId, userId) {
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.peers = new Map(); // { userId: { video, audio, stream } }
  }

  async startCall() {
    // Get local media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 }
    });

    // Create transport
    const transportParams = await this.socket.emitAsync('createWebRtcTransport');
    this.sendTransport = await this.device.createSendTransport(transportParams.params);

    // Produce audio
    const audioProducer = await this.sendTransport.produce({
      track: this.localStream.getAudioTracks()[0]
    });

    // Produce video
    const videoProducer = await this.sendTransport.produce({
      track: this.localStream.getVideoTracks()[0]
    });

    this.producers.set('audio', audioProducer);
    this.producers.set('video', videoProducer);

    // Notify room
    this.socket.emit('userJoinedCall', { roomId: this.roomId });
  }

  // Handle new producer from other user
  async handleNewProducer(producerId, kind, userId) {
    const recvTransport = await this.createRecvTransport();
    
    const consumer = await recvTransport.consume({
      producerId,
      rtpCapabilities: this.device.rtpCapabilities
    });

    if (!this.peers.has(userId)) {
      this.peers.set(userId, { video: null, audio: null });
    }

    this.peers.get(userId)[kind] = consumer;
    
    consumer.resume();
  }

  // Toggle camera
  async toggleCamera(enabled) {
    this.localStream.getVideoTracks()[0].enabled = enabled;
  }

  // Toggle microphone
  async toggleMicrophone(enabled) {
    this.localStream.getAudioTracks()[0].enabled = enabled;
  }

  // End call
  async endCall() {
    this.producers.forEach(p => p.close());
    this.consumers.forEach(c => c.close());
    this.localStream.getTracks().forEach(t => t.stop());
    this.socket.emit('userLeftCall', { roomId: this.roomId });
  }
}
```

**Features:**

- ✅ Scalable to 100+ participants
- ✅ Adaptive bitrate
- ✅ Screen sharing support
- ✅ Recording capability
- ✅ Participant muting
- ✅ Video quality selection
- ✅ Bandwidth optimization

---

### 6. Voice Messages

**Objective:** Enable asynchronous voice communication

**Implementation:**

```javascript
// Voice Message Schema
const voiceMessageSchema = new mongoose.Schema({
  roomId: mongoose.Schema.Types.ObjectId,
  senderId: mongoose.Schema.Types.ObjectId,
  audioUrl: String,
  duration: Number,
  waveform: [Number], // For waveform visualization
  transcription: String,
  createdAt: { type: Date, default: Date.now }
});

// Recording audio and uploading
class VoiceMessageRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      this.audioChunks.push(e.data);
    };

    this.mediaRecorder.start();
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
    });
  }

  async uploadVoiceMessage(roomId, audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('roomId', roomId);

    const response = await fetch('/api/rooms/voice-message', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }
}

// Backend endpoint
app.post('/api/rooms/voice-message', verifyToken, upload.single('audio'), async (req, res) => {
  try {
    const { roomId } = req.body;

    // Upload to S3
    const audioUrl = await uploadToS3(req.file, 'voice-messages');

    // Calculate duration
    const duration = await getAudioDuration(req.file.path);

    // Transcribe using Whisper API
    const transcription = await transcribeAudio(req.file.path);

    const voiceMessage = new VoiceMessage({
      roomId,
      senderId: req.userId,
      audioUrl,
      duration,
      transcription
    });

    await voiceMessage.save();

    // Broadcast to room
    io.to(roomId).emit('voice_message', {
      id: voiceMessage._id,
      senderId: req.userId,
      audioUrl,
      duration,
      transcription,
      createdAt: voiceMessage.createdAt
    });

    res.json({ success: true, voiceMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Features:**

- ✅ Audio recording & playback
- ✅ Duration display
- ✅ Waveform visualization
- ✅ Automatic transcription (Whisper API)
- ✅ Compression for storage
- ✅ Progress indication

---

## 🔍 Phase 3: Message Search & Advanced Features

### 7. Message Search Functionality

**Objective:** Enable full-text search across messages

**Implementation with MongoDB Text Index:**

```javascript
// Add text index to messages
messageSchema.index({ content: 'text', 'sender.username': 'text' });

// Full-text search endpoint
app.get('/api/search/messages', verifyToken, async (req, res) => {
  const { query, roomId, page = 1 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const skip = (page - 1) * 20;

  const results = await Message.find(
    { $text: { $search: query }, roomId },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .skip(skip)
  .limit(20)
  .populate('senderId', 'username avatar')
  .lean();

  const total = await Message.countDocuments({
    $text: { $search: query },
    roomId
  });

  res.json({
    results,
    total,
    page,
    pages: Math.ceil(total / 20)
  });
});

// Advanced search with filters
app.get('/api/search/messages/advanced', verifyToken, async (req, res) => {
  const {
    query,
    roomId,
    senderId,
    startDate,
    endDate,
    hasFiles,
    encrypted,
    page = 1
  } = req.query;

  const filter = {};

  if (roomId) filter.roomId = roomId;
  if (senderId) filter.senderId = senderId;
  if (query) filter.$text = { $search: query };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  if (hasFiles === 'true') filter.fileAttachment = { $exists: true };
  if (encrypted) filter.encrypted = encrypted === 'true';

  const skip = (page - 1) * 20;

  const results = await Message.find(filter)
    .skip(skip)
    .limit(20)
    .populate('senderId', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();

  const total = await Message.countDocuments(filter);

  res.json({
    results,
    total,
    filters: {
      query,
      roomId,
      senderId,
      dateRange: { startDate, endDate }
    }
  });
});

// Client-side implementation
class MessageSearch {
  async search(query, filters = {}) {
    const params = new URLSearchParams({
      query,
      ...filters
    });

    const response = await fetch(`/api/search/messages?${params}`);
    return response.json();
  }

  async advancedSearch(filters) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/search/messages/advanced?${params}`);
    return response.json();
  }

  // Highlight search results
  highlightMatches(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
```

**Features:**

- ✅ Full-text search
- ✅ Filter by room, user, date
- ✅ Search in encrypted messages (metadata only)
- ✅ Pagination
- ✅ Relevance scoring
- ✅ Result highlighting

---

### 8. Video Recording

**Objective:** Enable recording of video calls and messages

**Implementation with RecordRTC:**

```json
{
  "recordrtc": "^5.6.2",
  "webm-duration-fix": "^1.0.5"
}
```

**Implementation:**

```javascript
class CallRecorder {
  constructor(stream) {
    this.stream = stream;
    this.recorder = null;
    this.recordedBlobs = [];
    this.isRecording = false;
  }

  startRecording() {
    this.recorder = new RecordRTC(this.stream, {
      type: 'video',
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000,
      desiredSampleRate: 44100,
      bufferSize: 16384
    });

    this.recorder.startRecording();
    this.isRecording = true;
    return { success: true, timestamp: new Date() };
  }

  stopRecording() {
    return new Promise((resolve) => {
      this.recorder.stopRecording(() => {
        const blob = this.recorder.getBlob();
        this.isRecording = false;
        resolve(blob);
      });
    });
  }

  async uploadRecording(roomId, recordingBlob) {
    const formData = new FormData();
    formData.append('video', recordingBlob);
    formData.append('roomId', roomId);

    const response = await fetch('/api/calls/recording', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }

  // Get recording status
  getStatus() {
    return {
      isRecording: this.isRecording,
      duration: this.recorder?.getRecordingDuration() || 0
    };
  }
}

// Backend: Save recording
app.post('/api/calls/recording', verifyToken, upload.single('video'), async (req, res) => {
  try {
    const { roomId } = req.body;

    // Store to S3
    const videoUrl = await uploadToS3(req.file, 'recordings');

    // Get video metadata
    const metadata = await getVideoMetadata(req.file.path);

    const recording = new CallRecording({
      roomId,
      recordedBy: req.userId,
      videoUrl,
      duration: metadata.duration,
      fileSize: req.file.size,
      codec: metadata.codec
    });

    await recording.save();

    // Update room
    await Room.findByIdAndUpdate(roomId, {
      $push: { recordings: recording._id }
    });

    // Notify participants
    io.to(roomId).emit('recording_saved', {
      recordingId: recording._id,
      recordedBy: req.userId,
      duration: recording.duration,
      videoUrl
    });

    res.json({ success: true, recording });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve recording list
app.get('/api/calls/:roomId/recordings', verifyToken, async (req, res) => {
  const recordings = await CallRecording.find({
    roomId: req.params.roomId
  })
  .populate('recordedBy', 'username avatar')
  .sort({ createdAt: -1 });

  res.json(recordings);
});
```

**Features:**

- ✅ Video & audio recording
- ✅ Multiple codec support
- ✅ Compression
- ✅ Metadata extraction
- ✅ S3 storage
- ✅ Playback controls
- ✅ Download option
- ✅ Auto-cleanup old recordings

---

## 📱 Phase 4: Mobile & Analytics

### 9. Mobile App (React Native)

**Project Structure:**

```
mobile/
├── app.json                          # Expo config
├── App.tsx                           # Entry point
├── package.json
├── tsconfig.json
│
├── src/
│  ├── screens/                       # Screen components
│  │  ├── auth/
│  │  │  ├── LoginScreen.tsx
│  │  │  ├── RegisterScreen.tsx
│  │  │  └── OAuthScreen.tsx
│  │  ├── chat/
│  │  │  ├── RoomListScreen.tsx
│  │  │  ├── ChatScreen.tsx
│  │  │  └── GroupCallScreen.tsx
│  │  ├── calls/
│  │  │  ├── CallHistoryScreen.tsx
│  │  │  └── ActiveCallScreen.tsx
│  │  ├── profile/
│  │  │  ├── ProfileScreen.tsx
│  │  │  ├── SettingsScreen.tsx
│  │  │  └── NotificationsScreen.tsx
│  │  └── search/
│  │     └── SearchScreen.tsx
│  │
│  ├── components/                    # Reusable components
│  │  ├── MessageBubble.tsx
│  │  ├── VoiceMessagePlayer.tsx
│  │  ├── VideoTile.tsx
│  │  ├── ParticipantList.tsx
│  │  └── NotificationBell.tsx
│  │
│  ├── services/                      # API & services
│  │  ├── authService.ts
│  │  ├── socketService.ts
│  │  ├── storageService.ts
│  │  └── analyticsService.ts
│  │
│  ├── hooks/                         # Custom React hooks
│  │  ├── useAuth.ts
│  │  ├── useSocket.ts
│  │  ├── useCall.ts
│  │  └── useNotification.ts
│  │
│  ├── context/                       # Context API state
│  │  ├── AuthContext.tsx
│  │  ├── ChatContext.tsx
│  │  └── CallContext.tsx
│  │
│  ├── utils/                         # Utilities
│  │  ├── formatting.ts
│  │  ├── validation.ts
│  │  └── permissions.ts
│  │
│  ├── theme/                         # Styling
│  │  ├── colors.ts
│  │  ├── typography.ts
│  │  └── spacing.ts
│  │
│  └── types/                         # TypeScript types
│     └── index.ts
│
└── e2e/                             # End-to-end tests
   ├── auth.e2e.ts
   └── chat.e2e.ts
```

**Key Dependencies:**

```json
{
  "expo": "^49.0.0",
  "react": "^18.2.0",
  "react-native": "^0.72.0",
  "react-native-gifted-chat": "^2.4.0",
  "react-native-webrtc": "^111.0.0",
  "socket.io-client": "^4.6.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "expo-permissions": "^14.3.0",
  "expo-av": "^13.5.0",
  "expo-contacts": "^11.3.0",
  "react-native-firebase": "^18.0.0",
  "expo-notifications": "^0.20.0",
  "@react-native-async-storage/async-storage": "^1.19.0"
}
```

**Implementation Example:**

```typescript
// screens/chat/ChatScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView
} from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

export const ChatScreen: React.FC<{ route: any }> = ({ route }) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { socket, messages, sendMessage } = useSocket();
  const [messages_, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    socket?.emit('join_room', roomId);
    socket?.on('receive_message', (message) => {
      setMessages(prev => GiftedChat.append(prev, message));
    });

    return () => {
      socket?.emit('leave_room', roomId);
      socket?.off('receive_message');
    };
  }, [socket, roomId]);

  const handleSend = useCallback((messages: IMessage[]) => {
    const message = messages[0];
    socket?.emit('send_message', {
      roomId,
      content: message.text,
      timestamp: new Date()
    });
  }, [socket, roomId]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages_}
        onSend={handleSend}
        user={{
          _id: user?.id,
          name: user?.username,
          avatar: user?.avatar
        }}
        renderComposer={() => (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton}>
              <Text>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  composer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  }
});
```

**Key Features:**

- ✅ Cross-platform (iOS/Android)
- ✅ Real-time messaging
- ✅ Push notifications
- ✅ Voice messages
- ✅ Video calls
- ✅ Offline message queueing
- ✅ Local caching
- ✅ Dark mode support

---

### 10. Analytics Dashboard

**Objective:** Monitor app usage and performance

**Dashboard Features:**

```javascript
// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  roomId: mongoose.Schema.Types.ObjectId,
  eventType: String, // 'message_sent', 'call_started', 'video_played', etc.
  eventData: mongoose.Schema.Types.Mixed,
  duration: Number,
  platform: String, // 'web', 'ios', 'android'
  userAgent: String,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now, index: true }
});

// Dashboard Endpoints
app.get('/api/analytics/overview', verifyAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  const totalEvents = await Analytics.countDocuments(filter);
  
  const uniqueUsers = await Analytics.distinct('userId', filter);
  
  const eventBreakdown = await Analytics.aggregate([
    { $match: filter },
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);

  const platformStats = await Analytics.aggregate([
    { $match: filter },
    { $group: { _id: '$platform', count: { $sum: 1 } } }
  ]);

  res.json({
    totalEvents,
    uniqueUsers: uniqueUsers.length,
    eventBreakdown,
    platformStats,
    dateRange: { startDate, endDate }
  });
});

// User Activity Analytics
app.get('/api/analytics/users', verifyAdmin, async (req, res) => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'analytics',
        localField: '_id',
        foreignField: 'userId',
        as: 'activities'
      }
    },
    {
      $project: {
        username: 1,
        email: 1,
        createdAt: 1,
        lastSeen: 1,
        totalEvents: { $size: '$activities' },
        totalMessages: {
          $size: {
            $filter: {
              input: '$activities',
              as: 'activity',
              cond: { $eq: ['$$activity.eventType', 'message_sent'] }
            }
          }
        }
      }
    }
  ]);

  res.json(users);
});

// Call Statistics
app.get('/api/analytics/calls', verifyAdmin, async (req, res) => {
  const stats = await CallRecording.aggregate([
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
        totalStorageGB: { $sum: { $divide: ['$fileSize', 1e9] } }
      }
    }
  ]);

  res.json(stats[0] || { totalCalls: 0, totalDuration: 0 });
});

// Room Activity Analytics
app.get('/api/analytics/rooms', verifyAdmin, async (req, res) => {
  const roomStats = await Room.aggregate([
    {
      $lookup: {
        from: 'messages',
        localField: '_id',
        foreignField: 'roomId',
        as: 'messages'
      }
    },
    {
      $project: {
        name: 1,
        createdAt: 1,
        participantCount: { $size: '$participants' },
        messageCount: { $size: '$messages' },
        avgMessagesPerDay: {
          $divide: [
            { $size: '$messages' },
            {
              $ceil: {
                $divide: [
                  { $subtract: [new Date(), '$createdAt'] },
                  86400000
                ]
              }
            }
          ]
        }
      }
    },
    { $sort: { messageCount: -1 } }
  ]);

  res.json(roomStats);
});

// Real-time Dashboard Middleware
app.get('/api/analytics/live', verifyAdmin, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendUpdate = async () => {
    const onlineUsers = await User.countDocuments({ status: 'online' });
    const recentMessages = await Message.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 5 * 60000) }
    });
    const activeRooms = await Room.countDocuments({ isEmpty: false });

    res.write(`data: ${JSON.stringify({
      onlineUsers,
      recentMessages,
      activeRooms,
      timestamp: new Date()
    })}\n\n`);
  };

  const interval = setInterval(sendUpdate, 5000);

  req.on('close', () => clearInterval(interval));
});
```

**Analytics Features:**

- ✅ Real-time metrics
- ✅ User activity tracking
- ✅ Platform analytics
- ✅ Call statistics
- ✅ Room usage patterns
- ✅ Performance monitoring
- ✅ Data export (CSV/PDF)
- ✅ Custom dashboards

---

## 🔧 Implementation Timeline & Resources

### Week 1-2: Phase 1
- Set up MongoDB Atlas
- Implement Mongoose schemas
- Build authentication system
- Migrate data

**Estimated Effort:** 40-50 hours
**Resources Needed:** MongoDB Atlas (free tier), JWT/OAuth credentials

### Week 3: Phase 2
- User profiles
- Group video calls (MediaSoup setup)
- Voice messages

**Estimated Effort:** 35-40 hours
**Resources Needed:** AWS S3, OpenAI Whisper API, MediaSoup server

### Week 4: Phase 3
- Message search
- Video recording
- Storage optimization

**Estimated Effort:** 25-30 hours
**Resources Needed:** Elasticsearch (optional), S3 storage

### Week 5: Phase 4
- React Native setup
- Mobile implementation
- Analytics dashboard
- Testing & deployment

**Estimated Effort:** 45-50 hours
**Resources Needed:** TestFlight, Google Play Console, monitoring tools

---

## 💾 Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=443
HTTPS=true

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webrtc-chat
DB_NAME=webrtc-chat

# Authentication
JWT_SECRET=your-very-long-random-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=15m

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=webrtc-chat-storage

# Services
WHISPER_API_KEY=xxx
STRIPE_SECRET_KEY=xxx

# Monitoring
SENTRY_DSN=xxx
DATADOG_API_KEY=xxx

# WebRTC
ANNOUNCED_IP=your-server-ip
STUN_SERVERS=stun.l.google.com:19302,stun1.l.google.com:19302

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=xxx
```

---

## 📊 Success Metrics

- **Performance:** <200ms message latency, <500ms video startup
- **Reliability:** 99.9% uptime, <0.1% message loss
- **Scalability:** Support 10,000+ concurrent users
- **Security:** Zero data breaches, SOC2 compliance
- **UX:** >4.5 star rating on app stores

---

## 🚀 Deployment Strategy

### Production Checklist

- [ ] MongoDB backups configured (daily)
- [ ] SSL/TLS certificates (Let's Encrypt)
- [ ] Load balancer (Nginx/HAProxy)
- [ ] CDN for static assets (CloudFront)
- [ ] Monitoring & alerting (Datadog/New Relic)
- [ ] Error tracking (Sentry)
- [ ] Rate limiting & DDoS protection
- [ ] Security audit completed
- [ ] Performance optimization (caching, compression)
- [ ] Disaster recovery plan

---

## 📚 Additional Resources

1. **MongoDB Best Practices** - https://docs.mongodb.com/manual/
2. **Socket.IO Scaling** - https://socket.io/docs/v4/socket-io-protocol/
3. **MediaSoup Documentation** - https://mediasoup.org/
4. **React Native Best Practices** - https://reactnative.dev/docs/getting-started
5. **WebRTC Security** - https://www.rfc-editor.org/rfc/rfc8827.html

---

**Last Updated:** December 13, 2025
**Version:** 2.1.0-roadmap
**Status:** Ready for Implementation
