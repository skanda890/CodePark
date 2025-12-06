# CodePark Multiplayer Games

Real-time multiplayer game infrastructure for CodePark.

## Features

- ✅ WebSocket-based real-time communication (Socket.io)
- ✅ Room management and player sessions
- ✅ JWT authentication
- ✅ Redis session persistence
- ✅ Turn-based game state management
- ✅ Skill-based matchmaking (ELO rating)
- ✅ Game statistics tracking

## Installation

```bash
cd packages/games-multiplayer
npm install
```

## Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

## Development

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

## Production

```bash
# Start server
npm start
```

## API

### Socket Events

#### Client → Server

- `join_room`: Join a game room
- `player_move`: Make a game move
- `get_room_info`: Get room information

#### Server → Client

- `player_joined`: Player joined room
- `player_left`: Player left room
- `game_started`: Game started (room full)
- `game_update`: Game state updated
- `invalid_move`: Invalid move attempted
- `room_full`: Room is at max capacity

## Example Usage

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_room', 'room-123');
});

socket.on('game_started', (data) => {
  console.log('Game started!', data.gameState);
});

socket.on('game_update', (data) => {
  console.log('Game updated:', data);
});
```

## Architecture

```
src/
├── server.js           # Main server & connection handling
├── matchmaker.js       # Matchmaking algorithm
├── game-manager.js     # Game state management
└── utils/
    ├── auth.js         # JWT authentication
    └── validators.js   # Move validation
```

## Testing

Run test suite:

```bash
npm test
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
