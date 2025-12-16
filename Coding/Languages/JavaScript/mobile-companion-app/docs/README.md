# 📱 Mobile Companion App

Backend infrastructure for CodePark mobile companion app. Provides real-time synchronization, push notifications, offline-first sync using Yjs CRDT, and WebSocket-based communication.

## Features

- 🔗 **Real-time Sync**: WebSocket-based synchronization with CRDT
- 📬 **Push Notifications**: Firebase Cloud Messaging support
- 📵 **Offline-First**: Local data persistence and conflict-free merge
- 📡 **GraphQL Subscriptions**: Real-time data streaming
- 📱 **Mobile-Optimized**: Lightweight payloads for mobile networks
- 👥 **Presence Awareness**: Track online/offline users
- 💡 **Smart Notifications**: Batching and throttling support

## Installation

```bash
cd Coding/Languages/JavaScript/mobile-companion-app
npm install
```

## Environment Variables

```env
PORT=3003
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
NODE_ENV=development
```

## Usage

```bash
npm start
```

## WebSocket Events

### Client -> Server

- `register-device` - Register mobile device
- `sync-offline-data` - Sync CRDT changes
- `subscribe-project` - Listen to project updates

### Server -> Client

- `sync-ack` - Confirm sync receipt
- `notification` - Push notification
- `presence` - Online users list

## Dependencies

- `express@next` - Web framework
- `socket.io@next` - WebSocket support
- `firebase-admin@latest` - Firebase integration

## License

MIT
