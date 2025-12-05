# CodePark Games 🎮

This directory contains all game-related functionality for CodePark, including CLI games, API routes, utilities, and configuration.

## 📁 Structure

```
games/
├── cli/                    # Command-line interface games
│   └── numberGuessing.js   # Number guessing CLI game
├── routes/                 # API routes for web-based games
│   └── gameRoutes.js       # RESTful game endpoints
├── utils/                  # Game utility functions
│   └── gameHelpers.js      # Shared game logic
├── config/                 # Game configuration
│   └── gameConfig.js       # Centralized game settings
└── README.md              # This file
```

## 🎮 Games Available

### 1. Number Guessing Game

**Type**: CLI & API  
**Difficulty**: Easy  
**Players**: Single Player  
**Range**: Configurable (default: 1-100)

#### Description

Guess a randomly selected number within a configured range. The game provides intelligent feedback ("too high", "too low", "very close") until you find the correct number.

#### CLI Usage

```bash
# Start the game
node index.js --game
```

**Features**:

- 🎨 Beautiful ASCII art interface
- 📊 Attempt tracking
- 🎯 Proximity hints ("very close", "getting warmer")
- 🏆 Performance ratings
- ⚙️ Configurable number range
- 📞 Callback support for integration

#### API Usage

**Authentication Required**: Yes (JWT)

##### Endpoints

**1. Start Game**

```http
GET /api/v1/game/start
Authorization: Bearer <token>
```

Response:

```json
{
  "message": "Number guessing game started! Guess a number between 1 and 100.",
  "gameId": "1733425200000-123456789",
  "expiresIn": "30 minutes",
  "config": {
    "min": 1,
    "max": 100
  },
  "hint": "POST /api/v1/game/check with your guess"
}
```

**2. Check Guess**

```http
POST /api/v1/game/check
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameId": "1733425200000-123456789",
  "guess": 50
}
```

Responses:

```json
// Too high
{
  "result": "too_high",
  "attempts": 1,
  "hint": "Try a lower number"
}

// Too low
{
  "result": "too_low",
  "attempts": 2,
  "hint": "Try a higher number"
}

// Correct!
{
  "result": "correct",
  "attempts": 5,
  "message": "Congratulations! You guessed it in 5 attempt(s)!",
  "number": 42
}
```

**3. Get Statistics**

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
  "config": {
    "min": 1,
    "max": 100,
    "expiryMinutes": 30
  },
  "games": [
    {
      "gameId": "1733425200000-123456789",
      "createdAt": 1733425200000,
      "attempts": 3,
      "timeRemaining": 1680000
    }
  ]
}
```

**4. Cancel Game**

```http
DELETE /api/v1/game/:gameId
Authorization: Bearer <token>
```

Response:

```json
{
  "message": "Game cancelled successfully",
  "gameId": "1733425200000-123456789"
}
```

## ⚙️ Configuration

Game settings are centralized in `games/config/gameConfig.js`:

```javascript
module.exports = {
  numberGuessing: {
    min: 1, // Minimum number
    max: 100, // Maximum number
    expiryMinutes: 30, // Game expiration
    maxGames: 1000, // Max concurrent games
    cleanupIntervalSeconds: 60, // Cleanup frequency
  },
  general: {
    enableWebSocket: true, // Real-time notifications
    enableMetrics: true, // Prometheus metrics
    enableStats: true, // Statistics tracking
    maxAttempts: 0, // 0 = unlimited
    enableLeaderboards: false, // Future feature
  },
};
```

## 🔧 Utility Functions

The `games/utils/gameHelpers.js` module provides reusable functions:

```javascript
const {
  getGameOr404, // Retrieve game or send 404
  buildGuessResponse, // Build guess result
  isValidGuess, // Validate guess range
  calculateStats, // Calculate user stats
  generateRandomNumber, // Generate random number
  isGameExpired, // Check expiration
  cleanupExpiredGames, // Clean old games
} = require("./games/utils/gameHelpers");
```

## 🌐 WebSocket Integration

When WebSocket is enabled, real-time events are broadcast:

### Game Started

```javascript
{
  "type": "game:started",
  "gameId": "1733425200000-123456789",
  "message": "New game started",
  "config": {
    "min": 1,
    "max": 100
  }
}
```

### Guess Made

```javascript
{
  "type": "game:guess",
  "gameId": "1733425200000-123456789",
  "guess": 50,
  "result": "too_high",
  "attempts": 1,
  "isWin": false
}
```

### Game Cancelled

```javascript
{
  "type": "game:cancelled",
  "gameId": "1733425200000-123456789",
  "message": "Game cancelled"
}
```

## 📊 Metrics

The game system exposes Prometheus metrics:

```
# Number of currently active games
codepark_active_games 15

# Total games started (counter)
codepark_game_starts_total 1523

# Total games won (counter)
codepark_game_wins_total 847
```

Access metrics at: `http://localhost:9090/metrics`

## 🔒 Security

### Authentication

- ✅ All API endpoints require JWT authentication
- ✅ Users can only access their own games
- ✅ Game ownership verified on all operations

### Rate Limiting

- ✅ Dedicated game rate limiter (100 req/15min per IP)
- ✅ Prevents abuse and ensures fair resource usage
- ✅ Configurable per-game limits

### Input Validation

- ✅ All inputs validated using `express-validator`
- ✅ Range checking on guess values
- ✅ Type validation on all parameters
- ✅ SQL injection prevention via parameterized queries

### Resource Management

- ✅ Automatic game expiration (configurable)
- ✅ Maximum concurrent game limit
- ✅ Periodic cleanup of expired games
- ✅ Memory-efficient in-memory storage

## 👨‍💻 Development

### Adding New Games

#### 1. CLI Game

Create a new file in `games/cli/`:

```javascript
// games/cli/myNewGame.js
const gameConfig = require("../config/gameConfig");

function startMyGame(options = {}) {
  console.log("🎮 Welcome to My New Game!");
  // Game logic here
}

function getGameInfo() {
  return {
    name: "My New Game",
    description: "Description here",
    type: "CLI",
    difficulty: "Medium",
    players: 1,
  };
}

module.exports = { startMyGame, getGameInfo };
```

#### 2. API Game

Add routes in `games/routes/` or extend existing routes:

```javascript
// Add to games/routes/gameRoutes.js
router.get("/my-game/start", authMiddleware, (req, res) => {
  // Game start logic
});
```

#### 3. Update Configuration

Add game-specific config in `games/config/gameConfig.js`:

```javascript
myNewGame: {
  difficulty: 'medium',
  maxGames: 500,
  expiryMinutes: 60
}
```

### Testing

```bash
# Test CLI game
node index.js --game

# Test API endpoints (requires authentication)
curl -X GET http://localhost:3000/api/v1/game/start \
  -H "Authorization: Bearer <your-token>"

# Check guess
curl -X POST http://localhost:3000/api/v1/game/check \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"gameId": "123", "guess": 50}'
```

### Code Standards

When contributing game code:

1. ✅ Place CLI games in `games/cli/`
2. ✅ Place API routes in `games/routes/`
3. ✅ Place utilities in `games/utils/`
4. ✅ Add configuration in `games/config/`
5. ✅ Include comprehensive JSDoc comments
6. ✅ Add usage examples
7. ✅ Update this README
8. ✅ Write tests for new functionality
9. ✅ Follow existing code patterns
10. ✅ Use centralized configuration

## 🚀 Future Enhancements

### Planned Features

- [ ] Multiplayer support with real-time sync
- [ ] Global and per-game leaderboards
- [ ] Different difficulty levels
- [ ] Time-based challenges with countdowns
- [ ] Achievement system with badges
- [ ] Game history persistence to database
- [ ] Replay functionality
- [ ] Tournament mode
- [ ] Custom game modes
- [ ] AI opponents

### Game Ideas

#### Easy Difficulty

- [x] **Number Guessing** - Current implementation
- [ ] **Word Scramble** - Unscramble words
- [ ] **Math Challenge** - Solve simple equations
- [ ] **Memory Game** - Pattern matching

#### Medium Difficulty

- [ ] **Sudoku Solver** - Using `sudoku-gen` package
- [ ] **Trivia Quiz** - General knowledge questions
- [ ] **Hangman** - Word guessing with hints
- [ ] **Blackjack** - Card game against dealer

#### Hard Difficulty

- [ ] **Chess** - Full chess implementation
- [ ] **Poker** - Texas Hold'em variant
- [ ] **Code Golf** - Shortest code challenges
- [ ] **Strategy Game** - Turn-based strategy

## 📚 API Documentation

For complete API documentation, see:

- [API Reference](../docs/API.md)
- [Authentication Guide](../docs/AUTHENTICATION.md)
- [WebSocket Events](../docs/WEBSOCKET.md)

## 🤝 Contributing

We welcome contributions! Please:

1. 🍴 Fork the repository
2. 🔧 Create a feature branch (`git checkout -b feature/awesome-game`)
3. 💻 Make your changes
4. ✅ Test thoroughly
5. 📝 Update documentation
6. 🚀 Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## 🐛 Reporting Issues

Found a bug? Please report it:

- 📧 Email: support@codepark.dev
- 🐛 GitHub Issues: [Create Issue](https://github.com/skanda890/CodePark/issues/new)
- 💬 Discord: [Join Server](https://discord.gg/codepark)

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- The CodePark development team
- Contributors and testers
- Open-source community

---

**Last Updated**: December 2025  
**Games Version**: 1.0  
**Maintainer**: [@skanda890](https://github.com/skanda890)

---

**Made with ❤️ for CodePark**
