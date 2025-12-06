// matchmaker.js - Skill-based matchmaking system
const { v4: uuidv4 } = require('uuid')

class Matchmaker {
  constructor () {
    this.queues = {
      casual: [],
      ranked: []
    }
    this.matches = new Map()
  }

  addToQueue (player, mode = 'casual') {
    if (!this.queues[mode]) {
      throw new Error(`Invalid queue mode: ${mode}`)
    }

    this.queues[mode].push({
      ...player,
      queuedAt: Date.now(),
      matchId: null
    })

    return this.findMatches(mode)
  }

  findMatches (mode = 'casual') {
    const queue = this.queues[mode]
    if (queue.length < 2) return null

    // Sort by skill rating
    queue.sort((a, b) => a.rating - b.rating)

    // Find best match pair
    for (let i = 0; i < queue.length - 1; i++) {
      const player1 = queue[i]
      const player2 = queue[i + 1]

      // Check skill difference (within 200 rating points)
      if (Math.abs(player1.rating - player2.rating) <= 200) {
        const matchId = uuidv4()
        const match = {
          id: matchId,
          mode,
          players: [player1, player2],
          startTime: Date.now(),
          status: 'active'
        }

        this.matches.set(matchId, match)

        // Remove from queue
        queue.splice(i + 1, 1)
        queue.splice(i, 1)

        return match
      }
    }

    return null
  }

  removeFromQueue (playerId, mode = 'casual') {
    const queue = this.queues[mode]
    const index = queue.findIndex((p) => p.id === playerId)
    if (index !== -1) {
      queue.splice(index, 1)
      return true
    }
    return false
  }

  endMatch (matchId, results) {
    const match = this.matches.get(matchId)
    if (!match) return null

    match.status = 'completed'
    match.endTime = Date.now()
    match.results = results

    return match
  }

  getQueueStats (mode = 'casual') {
    const queue = this.queues[mode] || []
    return {
      mode,
      queueSize: queue.length,
      avgWaitTime: this.calculateAvgWaitTime(queue),
      topRatings: queue
        .map((p) => p.rating)
        .sort((a, b) => b - a)
        .slice(0, 10)
    }
  }

  calculateAvgWaitTime (queue) {
    if (queue.length === 0) return 0
    const now = Date.now()
    const totalWait = queue.reduce(
      (sum, player) => sum + (now - player.queuedAt),
      0
    )
    return Math.round(totalWait / queue.length)
  }
}

module.exports = Matchmaker
