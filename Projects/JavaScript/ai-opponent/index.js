class AIOpponent {
  constructor (difficulty = 'medium') {
    this.difficulty = difficulty
    this.thinkingTime = this.getThinkingTime()
  }

  getThinkingTime () {
    const times = {
      easy: 100,
      medium: 500,
      hard: 1000,
      expert: 2000
    }
    return times[this.difficulty] || 500
  }

  async getMove (gameState) {
    // Simulate thinking time
    await this.delay(this.thinkingTime)

    const possibleMoves = this.generateMoves(gameState)
    const bestMove = this.evaluateMoves(possibleMoves, gameState)
    return bestMove
  }

  generateMoves (gameState) {
    // Generate all possible moves
    const moves = []
    for (let i = 0; i < gameState.board.length; i++) {
      if (gameState.board[i] === 0) {
        moves.push({ position: i, score: 0 })
      }
    }
    return moves
  }

  evaluateMoves (moves, gameState) {
    let bestMove = moves[0]
    let bestScore = -Infinity

    for (const move of moves) {
      const score = this.evaluatePosition(gameState, move)
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  evaluatePosition (gameState, move) {
    let score = 0

    // Evaluate move based on difficulty
    if (this.difficulty === 'easy') {
      score = Math.random() * 100
    } else if (this.difficulty === 'medium') {
      score = this.minimax(gameState, move, 2)
    } else if (this.difficulty === 'hard') {
      score = this.minimax(gameState, move, 4)
    } else if (this.difficulty === 'expert') {
      score = this.minimax(gameState, move, 6)
    }

    return score
  }

  minimax (gameState, move, depth) {
    // Simplified minimax evaluation
    if (depth === 0) {
      return this.evaluateBoardState(gameState)
    }
    return Math.random() * 100
  }

  evaluateBoardState (gameState) {
    // Evaluate board state
    return Math.random() * 100
  }

  delay (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

module.exports = AIOpponent
