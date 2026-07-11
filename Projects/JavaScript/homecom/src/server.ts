import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { db } from './database.js';

export type PresenceState = 'Online' | 'Busy' | 'Away' | 'Sleeping' | 'In Call' | 'DND';

export interface DeviceNode {
  deviceId: string;
  socketId: string;
  deviceType: 'web' | 'terminal' | 'mobile';
  presence: PresenceState;
}

export interface UserSession {
  userId: string;
  devices: Map<string, DeviceNode>;
}

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const activeSessions = new Map<string, UserSession>();
const socketToUserMap = new Map<string, { userId: string; deviceId: string }>();

// Read custom smart routing logic straight from config layout
let routingConfig = { simultaneousRing: true };
try {
  const fileContents = fs.readFileSync(path.resolve('config/routing.yaml'), 'utf8');
  routingConfig = parse(fileContents).routing;
  console.log('[Config] Successfully integrated local YAML routing maps.');
} catch (e) {
  console.log('[Config Warning] Failed loading routing.yaml, fallback defaults active.');
}

// REST Gateway Endpoints
app.get('/api/caller-intelligence/:phone', async (req: Request, res: Response) => {
  const profile = await db.getProfile(req.params.phone);
  res.json(profile);
});

app.post('/api/ai/screen-call', async (req: Request, res: Response) => {
  const { transcription } = req.body;
  try {
    // Pipeline link interacting with local air-gapped Ollama micro-service
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `Evaluate if this caller statement sounds like a automated robocall or human spam. Return a classification label followed by a short reason:\n\n"${transcription}"`,
        stream: false
      })
    });
    const parsed = await ollamaResponse.json();
    res.json({ analysis: parsed.response });
  } catch (err) {
    res.json({ analysis: 'Local AI Node offline. Defaulting screening protocol to manual verification.' });
  }
});

// Socket Real-time Core Channel Architecture
io.on('connection', (socket: Socket) => {
  socket.on('register-device', (payload: { userId: string; deviceId: string; deviceType: 'web' | 'terminal' | 'mobile' }) => {
    const { userId, deviceId, deviceType } = payload;
    if (!activeSessions.has(userId)) {
      activeSessions.set(userId, { userId, devices: new Map() });
    }
    activeSessions.get(userId)!.devices.set(deviceId, {
      deviceId, socketId: socket.id, deviceType, presence: 'Online'
    });
    socketToUserMap.set(socket.id, { userId, deviceId });
    socket.join(userId);
    
    io.emit('presence-update', { userId, deviceId, status: 'Online' });
    console.log(`[Mesh Core] Registered Device Node [${deviceId}] for User [${userId}]`);
  });

  socket.on('send-message', async (payload: { targetUserId: string; content: string }) => {
    const mapping = socketToUserMap.get(socket.id);
    if (!mapping) return;
    
    await db.logMessage(mapping.userId, payload.targetUserId, payload.content);
    io.to(payload.targetUserId).emit('incoming-message', {
      senderUserId: mapping.userId,
      content: payload.content
    });
  });

  socket.on('webrtc-signaling', (payload: { targetUserId: string; signalData: any }) => {
    const mapping = socketToUserMap.get(socket.id);
    if (!mapping) return;
    socket.to(payload.targetUserId).emit('webrtc-signaling', {
      senderUserId: mapping.userId,
      signalData: payload.signalData
    });
  });

  socket.on('disconnect', () => {
    const mapping = socketToUserMap.get(socket.id);
    if (mapping) {
      activeSessions.get(mapping.userId)?.devices.delete(mapping.deviceId);
      io.emit('presence-update', { userId: mapping.userId, deviceId: mapping.deviceId, status: 'Offline' });
      socketToUserMap.delete(socket.id);
    }
  });
});

const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`\n🏡 HomeCom Node Server active on http://localhost:${PORT}`);
});