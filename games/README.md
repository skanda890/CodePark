# CodePark Games 🎮

This directory contains all game-related functionality for CodePark.

## Structure

```
games/
├── cli/                    # Command-line interface games
│   └── numberGuessing.js   # Number guessing CLI game
├── routes/                 # API routes for web-based games
│   └── gameRoutes.js       # RESTful game endpoints
└── README.md              # This file
```

## Games Available

### 1. Number Guessing Game

**Type**: CLI & API  
**Difficulty**: Easy  
**Players**: Single Player

#### Description
Guess a randomly selected number between 1 and 100. The game provides feedback ("too high" or "too low") until you find the correct number.

#### CLI Usage

```bash
# Start the game
node index.js --game
```

**Features**:
- Interactive command-line interface
- Real-time feedback
- Attempt tracking
- Configurable number range

#### API Usage

**Authentication Required**: Yes (JWT)

**Endpoints**:

1. **Start Game**
   ```http
   GET /api/v1/game/start
   Authorization: Bearer <token>
   ```
   
   Response:
   ```json
   {
     "message": "Number guessing game started!",
     "gameId": "1234567890-123456789",
     "expiresIn": "30 minutes"
   }
   ```

2. **Check Guess**
   ```http
   POST /api/v1/game/check
   Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "gameId": "1234567890-123456789",
     "guess": 50
   }
   ```
   
   Response:
   ```json
   {
     "result": "too_high",
     "message": "Too high! Try again.",
     "attempts": 1,
     "gameId": "1234567890-123456789"
   }
   ```

3. **Get Statistics**
   ```http
   GET /api/v1/game/stats
   Authorization: Bearer <token>
   ```
   
   Response:
   ```json
   {
     "activeGames": 2,
     "totalActiveGames": 15,
     "maxGames": 1000,
     "games": [
       {
         "gameId": "1234567890-123456789",
         "createdAt": 1701878400000,
         "attempts": 3
       }
     ]
   }
   ```

4. **Cancel Game**
   ```http
   DELETE /api/v1/game/:gameId
   Authorization: Bearer <token>
   ```

## Configuration

Game settings are configured in `config/index.js`:

```javascript
module.exports = {
  game: {
    expiryMinutes: 30,    // Game expiration time
    maxGames: 1000,       // Maximum concurrent games
    cleanupInterval: 60   // Cleanup interval in seconds
  }
};
```

## Features

### CLI Game Features
- ✅ Interactive prompt-based gameplay
- ✅ Input validation
- ✅ Attempt tracking
- ✅ Configurable number range
- ✅ Callbacks for success and attempts

### API Game Features
- ✅ RESTful API endpoints
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ WebSocket notifications (optional)
- ✅ Automatic game expiration
- ✅ User-specific game isolation
- ✅ Game statistics tracking
- ✅ Prometheus metrics integration

## WebSocket Integration

When WebSocket is enabled, real-time events are broadcast:

```javascript
// Game started event
{
  "type": "game:started",
  "gameId": "1234567890-123456789",
  "message": "New game started"
}

// Guess made event
{
  "type": "game:guess",
  "gameId": "1234567890-123456789",
  "guess": 50,
  "result": "too_high",
  "attempts": 1
}
```

## Metrics

The game system exposes Prometheus metrics:

- `codepark_active_games` - Number of currently active games
- `codepark_game_starts_total` - Total number of games started
- `codepark_game_wins_total` - Total number of games won

## Security

### Rate Limiting
- Game endpoints have dedicated rate limiters
- Prevents abuse and ensures fair resource usage

### Authentication
- All API endpoints require JWT authentication
- Users can only access their own games

### Input Validation
- All inputs are validated using `express-validator`
- Prevents injection attacks and malformed requests

### Game Isolation
- Each user's games are isolated
- Games automatically expire after configured time
- Maximum game limit prevents resource exhaustion

## Development

### Adding New Games

1. **CLI Games**: Create a new file in `games/cli/`
2. **API Games**: Add routes in `games/routes/`
3. **Update Documentation**: Update this README

### Example: Adding a New CLI Game

```javascript
// games/cli/myNewGame.js

function startMyGame(options = {}) {
  // Game logic here
  console.log('Welcome to My New Game!');
}

module.exports = { startMyGame };
```

### Testing

```bash
# Test CLI game
node index.js --game

# Test API endpoints (requires authentication)
curl -X GET http://localhost:3000/api/v1/game/start \
  -H "Authorization: Bearer <your-token>"
```

## Future Enhancements

### Planned Features
- [ ] Multiplayer support
- [ ] Leaderboards
- [ ] Different difficulty levels
- [ ] Time-based challenges
- [ ] Achievement system
- [ ] Game history persistence
- [ ] More game types (Tic-Tac-Toe, Word Guessing, etc.)

### Game Ideas
- **Sudoku Solver** - Using the `sudoku-gen` package
- **Trivia Quiz** - General knowledge questions
- **Word Scramble** - Unscramble words
- **Math Challenge** - Solve math problems
- **Memory Game** - Pattern matching

## Contributing

When contributing game-related code:

1. Place CLI games in `games/cli/`
2. Place API routes in `games/routes/`
3. Add comprehensive JSDoc comments
4. Include usage examples
5. Update this README
6. Write tests for new functionality

## Support

For questions or issues related to games:
- 📧 Email: support@codepark.dev
- 🐛 Issues: [GitHub Issues](https://github.com/skanda890/CodePark/issues)
- 💬 Discord: [Join our server](https://discord.gg/codepark)

---

**Last Updated**: December 2025  
**Games Version**: 1.0