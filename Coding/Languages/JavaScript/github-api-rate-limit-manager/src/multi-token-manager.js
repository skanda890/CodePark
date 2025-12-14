/**
 * Multi-Token Manager for GitHub API Rate Limit Management
 * 
 * Features:
 * - Manage 2+ GitHub tokens simultaneously
 * - Health-based automatic token rotation
 * - Per-token statistics and monitoring
 * - Team quota aggregation
 * - Failure detection and recovery
 */

class MultiTokenManager {
  constructor(tokens = []) {
    this.tokens = tokens.map((token, idx) => ({
      id: idx,
      token,
      health: 100,
      remaining: 5000,
      limit: 5000,
      reset: null,
      lastUsed: null,
      requestCount: 0,
      errorCount: 0,
      rotations: 0,
      active: true,
      createdAt: new Date()
    }));
    
    this.currentIndex = 0;
    this.rotationHistory = [];
    this.teamStats = {
      totalRequests: 0,
      totalErrors: 0,
      combinedRemaining: 0,
      combinedLimit: 0,
      averageHealth: 100
    };
  }

  /**
   * Calculate token health based on remaining requests
   */
  calculateHealth(token) {
    const percentageRemaining = (token.remaining / token.limit) * 100;
    const baseHealth = percentageRemaining;
    const errorPenalty = token.errorCount * 5;
    
    return Math.max(0, baseHealth - errorPenalty);
  }

  /**
   * Update token stats from GitHub API response
   */
  updateTokenStats(tokenId, rateData) {
    const token = this.tokens[tokenId];
    if (!token) return;

    token.remaining = rateData.remaining || 0;
    token.limit = rateData.limit || 5000;
    token.reset = rateData.reset ? new Date(rateData.reset * 1000) : null;
    token.lastUsed = new Date();
    token.requestCount++;
    token.health = this.calculateHealth(token);

    this.updateTeamStats();
  }

  /**
   * Record error for a token
   */
  recordError(tokenId, error) {
    const token = this.tokens[tokenId];
    if (!token) return;

    token.errorCount++;
    token.health = this.calculateHealth(token);
    
    if (error?.status === 403 && error?.message?.includes('rate limit')) {
      token.active = false;
    }
  }

  /**
   * Get next healthy token with automatic rotation
   */
  getNextToken() {
    const activeTokens = this.tokens.filter(t => t.active && t.health > 10);
    
    if (activeTokens.length === 0) {
      throw new Error('No healthy tokens available');
    }

    // Sort by health (descending)
    activeTokens.sort((a, b) => b.health - a.health);
    
    const selectedToken = activeTokens[0];
    this.recordTokenRotation(selectedToken.id);
    
    return {
      token: selectedToken.token,
      id: selectedToken.id,
      health: selectedToken.health
    };
  }

  /**
   * Automatic token rotation with logging
   */
  rotateToken() {
    const healthyTokens = this.tokens.filter(t => t.active);
    
    if (healthyTokens.length === 0) {
      return null;
    }

    // Find token with best health
    let bestToken = healthyTokens[0];
    for (const token of healthyTokens) {
      if (token.health > bestToken.health) {
        bestToken = token;
      }
    }

    bestToken.rotations++;
    this.recordTokenRotation(bestToken.id);
    
    return bestToken;
  }

  /**
   * Record token rotation event
   */
  recordTokenRotation(tokenId) {
    this.rotationHistory.push({
      tokenId,
      timestamp: new Date(),
      reason: 'health_based_rotation',
      previousHealth: this.tokens[tokenId].health
    });

    // Keep last 100 rotations
    if (this.rotationHistory.length > 100) {
      this.rotationHistory.shift();
    }
  }

  /**
   * Update aggregated team statistics
   */
  updateTeamStats() {
    this.teamStats.totalRequests = this.tokens.reduce((sum, t) => sum + t.requestCount, 0);
    this.teamStats.totalErrors = this.tokens.reduce((sum, t) => sum + t.errorCount, 0);
    this.teamStats.combinedRemaining = this.tokens.reduce((sum, t) => sum + t.remaining, 0);
    this.teamStats.combinedLimit = this.tokens.reduce((sum, t) => sum + t.limit, 0);
    this.teamStats.averageHealth = this.tokens.length > 0
      ? this.tokens.reduce((sum, t) => sum + t.health, 0) / this.tokens.length
      : 0;
  }

  /**
   * Get per-token statistics
   */
  getTokenStats(tokenId) {
    const token = this.tokens[tokenId];
    if (!token) return null;

    return {
      id: token.id,
      health: token.health,
      remaining: token.remaining,
      limit: token.limit,
      percentageUsed: ((token.limit - token.remaining) / token.limit) * 100,
      requestCount: token.requestCount,
      errorCount: token.errorCount,
      rotations: token.rotations,
      active: token.active,
      reset: token.reset,
      lastUsed: token.lastUsed,
      createdAt: token.createdAt
    };
  }

  /**
   * Get all token statistics
   */
  getAllTokenStats() {
    return this.tokens.map((_, idx) => this.getTokenStats(idx));
  }

  /**
   * Aggregate team quota information
   */
  getTeamQuota() {
    return {
      teamStats: this.teamStats,
      tokens: this.getAllTokenStats(),
      healthStatus: this.teamStats.averageHealth > 70 ? 'healthy' : 
                    this.teamStats.averageHealth > 40 ? 'warning' : 'critical',
      recommendedAction: this.getTeamRecommendation()
    };
  }

  /**
   * Recovery mechanism for failed tokens
   */
  recoveryCheckpoint(tokenId) {
    const token = this.tokens[tokenId];
    if (!token) return;

    // Attempt to reactivate token if error rate dropped
    if (!token.active && token.errorCount < 5) {
      token.active = true;
      token.health = this.calculateHealth(token);
    }
  }

  /**
   * Get recommendation based on team health
   */
  getTeamRecommendation() {
    const { averageHealth, combinedRemaining } = this.teamStats;

    if (averageHealth < 20) {
      return 'CRITICAL: Add more tokens immediately';
    } else if (averageHealth < 50) {
      return 'WARNING: Consider adding backup tokens';
    } else if (combinedRemaining < 100) {
      return 'INFO: Plan for reset or add tokens';
    }
    
    return 'OK: Team quota is healthy';
  }

  /**
   * Reset all tokens (use after rate limit reset)
   */
  resetAllTokens() {
    this.tokens.forEach(token => {
      token.remaining = token.limit;
      token.reset = null;
      token.active = true;
    });
    this.updateTeamStats();
  }

  /**
   * Get rotation history
   */
  getRotationHistory(limit = 10) {
    return this.rotationHistory.slice(-limit).reverse();
  }
}

module.exports = MultiTokenManager;
