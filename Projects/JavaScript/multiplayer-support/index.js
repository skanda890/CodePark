const EventEmitter = require('events');

class GameRoom extends EventEmitter {
  constructor(roomId, options = {}) {
    super();
    this.roomId = roomId;
    this.maxPlayers = options.maxPlayers || 4;
    this.players = new Map();
    this.gameState = {};
    this.gameType = options.gameType || 'competitive';
    this.createdAt = new Date();
  }

  async addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      throw new Error('Room is full');
    }

    this.players.set(player.id, {
      ...player,
      joinedAt: new Date(),
      ready: false,
      score: 0
    });

    this.emit('playerJoined', player);
    return true;
  }

  async removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.emit('playerLeft', playerId);
      return true;
    }
    return false;
  }

  async updateGameState(newState) {
    this.gameState = { ...this.gameState, ...newState };
    this.emit('stateUpdate', this.gameState);
  }

  async broadcastMessage(message) {
    this.emit('message', message);
    for (const player of this.players.values()) {
      // Send message to each player
    }
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  isReady() {
    if (this.players.size === 0) return false;
    return Array.from(this.players.values()).every(p => p.ready);
  }

  async start() {
    if (!this.isReady()) {
      throw new Error('Not all players are ready');
    }
    this.emit('gameStart');
  }

  async end() {
    this.emit('gameEnd');
  }
}

module.exports = GameRoom;
