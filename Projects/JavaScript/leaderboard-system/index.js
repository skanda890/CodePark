class LeaderboardSystem {
  constructor() {
    this.scores = new Map();
    this.achievements = new Map();
  }

  async recordScore(userId, score, gameId) {
    const key = `${gameId}:${userId}`;
    const existingScore = this.scores.get(key);

    if (!existingScore || score > existingScore.score) {
      this.scores.set(key, {
        userId,
        score,
        gameId,
        timestamp: new Date(),
        rank: 0
      });
    }
  }

  async getLeaderboard(gameId, limit = 100) {
    const gameScores = [];
    for (const [key, record] of this.scores.entries()) {
      if (record.gameId === gameId) {
        gameScores.push(record);
      }
    }

    gameScores.sort((a, b) => b.score - a.score);
    gameScores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return gameScores.slice(0, limit);
  }

  async getUserRank(userId, gameId) {
    const leaderboard = await this.getLeaderboard(gameId);
    return leaderboard.find(score => score.userId === userId);
  }

  async awardAchievement(userId, achievementId, name, description) {
    const key = `${userId}:${achievementId}`;
    if (!this.achievements.has(key)) {
      this.achievements.set(key, {
        userId,
        achievementId,
        name,
        description,
        unlockedAt: new Date()
      });
      return true;
    }
    return false;
  }

  async getUserAchievements(userId) {
    const userAchievements = [];
    for (const [key, achievement] of this.achievements.entries()) {
      if (achievement.userId === userId) {
        userAchievements.push(achievement);
      }
    }
    return userAchievements;
  }
}

module.exports = LeaderboardSystem;
