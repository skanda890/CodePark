/**
 * Cost Analysis Module for GitHub API Rate Limit Manager
 * 
 * Features:
 * - Per-endpoint cost calculation
 * - GraphQL vs REST efficiency comparison
 * - 7-day and 30-day usage summaries
 * - Daily average calculation
 * - 30-day usage forecasting
 * - Estimated days until rate limit exhaustion
 * - Cost optimization recommendations
 */

class CostAnalyzer {
  constructor(config = {}) {
    this.endpointCosts = config.endpointCosts || this.getDefaultCosts();
    this.logs = [];
    this.usageHistory = [];
    this.maxHistorySize = config.maxHistorySize || 30;
  }

  /**
   * Get default endpoint costs
   */
  getDefaultCosts() {
    return {
      rest: {
        'GET /repos/{owner}/{repo}': 1,
        'GET /repos/{owner}/{repo}/issues': 1,
        'GET /repos/{owner}/{repo}/pulls': 1,
        'GET /repos/{owner}/{repo}/commits': 1,
        'POST /repos/{owner}/{repo}/issues': 1,
        'PATCH /repos/{owner}/{repo}/issues/{issue_number}': 1,
        'GET /user': 1,
        'GET /user/repos': 1,
        'GET /search/repositories': 30, // Search has 30 req/min limit
        'GET /search/code': 30,
        'GET /search/issues': 30
      },
      graphql: {
        'viewer { login }': 1,
        'repository(owner:x name:y) { issues { totalCount } }': 1,
        'search(first:100 type:REPOSITORY query:x) { edges { node { name } } }': 2,
        'repository(owner:x name:y) { issues(first:100) { edges { node { title } } } }': 5
      }
    };
  }

  /**
   * Log API usage
   */
  logUsage(endpoint, method, cost, responseTime = 0) {
    const usage = {
      timestamp: new Date(),
      endpoint,
      method,
      cost,
      responseTime,
      type: endpoint.includes('graphql') ? 'graphql' : 'rest'
    };

    this.logs.push(usage);
    return { logged: true, cost };
  }

  /**
   * Calculate cost for specific endpoint
   */
  calculateEndpointCost(endpoint, method = 'GET') {
    const key = `${method} ${endpoint}`;
    
    if (this.endpointCosts.rest[key]) {
      return { cost: this.endpointCosts.rest[key], type: 'rest', endpoint: key };
    }

    // Try to find by pattern
    for (const [pattern, cost] of Object.entries(this.endpointCosts.rest)) {
      if (this.matchPattern(endpoint, pattern)) {
        return { cost, type: 'rest', endpoint: pattern };
      }
    }

    // Default cost
    return { cost: 1, type: 'rest', estimated: true };
  }

  /**
   * Match endpoint pattern
   */
  matchPattern(endpoint, pattern) {
    const regex = pattern.replace(/{[^}]+}/g, '[^/]+');
    return new RegExp(`^${regex}$`).test(endpoint);
  }

  /**
   * Compare GraphQL vs REST efficiency
   */
  compareGraphQLvsREST(query, restEndpoints) {
    // GraphQL usually costs 1-2 points per query
    const graphqlCost = 2;
    
    // Calculate equivalent REST calls
    const restCost = restEndpoints.reduce((sum, ep) => {
      return sum + (this.endpointCosts.rest[ep] || 1);
    }, 0);

    const efficiency = ((1 - graphqlCost / restCost) * 100).toFixed(2);

    return {
      graphqlCost,
      restEquivalent: restCost,
      costSavings: restCost - graphqlCost,
      efficiencyGain: efficiency + '%',
      recommendation: graphqlCost < restCost
        ? `Use GraphQL (save ${restCost - graphqlCost} requests)`
        : 'Use REST API for this use case'
    };
  }

  /**
   * Get 7-day usage summary
   */
  get7DayUsage() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const relevantLogs = this.logs.filter(log => new Date(log.timestamp) >= sevenDaysAgo);
    
    return this.calculateUsageSummary(relevantLogs, 7);
  }

  /**
   * Get 30-day usage summary
   */
  get30DayUsage() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const relevantLogs = this.logs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
    
    return this.calculateUsageSummary(relevantLogs, 30);
  }

  /**
   * Calculate usage summary
   */
  calculateUsageSummary(logs, days) {
    if (logs.length === 0) {
      return {
        days,
        totalRequests: 0,
        totalCost: 0,
        dailyAverage: 0,
        restRequests: 0,
        graphqlRequests: 0,
        breakdown: { rest: 0, graphql: 0 }
      };
    }

    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const restLogs = logs.filter(log => log.type === 'rest');
    const graphqlLogs = logs.filter(log => log.type === 'graphql');

    return {
      days,
      totalRequests: logs.length,
      totalCost,
      dailyAverage: (logs.length / days).toFixed(2),
      avgCostPerRequest: (totalCost / logs.length).toFixed(2),
      restRequests: restLogs.length,
      graphqlRequests: graphqlLogs.length,
      breakdown: {
        rest: {
          count: restLogs.length,
          cost: restLogs.reduce((sum, log) => sum + log.cost, 0)
        },
        graphql: {
          count: graphqlLogs.length,
          cost: graphqlLogs.reduce((sum, log) => sum + log.cost, 0)
        }
      }
    };
  }

  /**
   * Forecast usage for next 30 days
   */
  forecast30Days() {
    const sevenDayUsage = this.get7DayUsage();
    const thirtyDayUsage = this.get30DayUsage();

    // Use 30-day average if available, otherwise use 7-day
    const avgDaily = thirtyDayUsage.totalRequests > 0
      ? thirtyDayUsage.totalRequests / 30
      : sevenDayUsage.totalRequests / 7;

    const projectedTotal = Math.round(avgDaily * 30);
    const projectedCost = projectedTotal * (sevenDayUsage.avgCostPerRequest || 1);

    return {
      period: 'next 30 days',
      projectedRequests: projectedTotal,
      projectedCost: Math.round(projectedCost),
      basedOn: sevenDayUsage.totalRequests > 0 ? '7-day average' : 'limited data',
      confidence: sevenDayUsage.totalRequests > 100 ? 'high' : 'low'
    };
  }

  /**
   * Estimate days until rate limit exhaustion
   */
  estimateDaysUntilLimit(currentRemaining, dailyUsage) {
    if (dailyUsage <= 0) {
      return { days: Infinity, message: 'No usage recorded' };
    }

    const daysRemaining = Math.floor(currentRemaining / dailyUsage);
    const hoursRemaining = Math.round((currentRemaining % dailyUsage) * 24);

    return {
      daysRemaining,
      hoursRemaining,
      currentRemaining,
      dailyUsage: Math.round(dailyUsage),
      exhaustionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000),
      critical: daysRemaining < 3,
      warning: daysRemaining < 7
    };
  }

  /**
   * Get cost optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const thirtyDayUsage = this.get30DayUsage();

    // Check GraphQL vs REST usage
    if (thirtyDayUsage.breakdown.rest.count > 0) {
      const restPercentage = (thirtyDayUsage.breakdown.rest.count / thirtyDayUsage.totalRequests) * 100;
      if (restPercentage > 80) {
        recommendations.push({
          priority: 'high',
          category: 'API Selection',
          recommendation: 'Consider using GraphQL for batch operations',
          potential_savings: '30-50% request reduction',
          implementation: 'Consolidate multiple REST calls into single GraphQL query'
        });
      }
    }

    // Check for search API abuse
    const searchCost = this.logs
      .filter(log => log.endpoint?.includes('search'))
      .reduce((sum, log) => sum + log.cost, 0);

    if (searchCost > 100) {
      recommendations.push({
        priority: 'medium',
        category: 'Search Optimization',
        recommendation: 'Reduce search API usage',
        potential_savings: '20-40% request reduction',
        implementation: 'Implement caching or reduce search frequency'
      });
    }

    // Check daily consistency
    const avgDaily = this.get7DayUsage().totalRequests / 7;
    const variance = this.calculateVariance(this.logs);
    
    if (variance > avgDaily * 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'Usage Pattern',
        recommendation: 'Usage is inconsistent - consider rate limiting',
        potential_savings: '15-30% request reduction',
        implementation: 'Implement request throttling and backoff'
      });
    }

    recommendations.push({
      priority: 'low',
      category: 'Conditional Requests',
      recommendation: 'Use ETags for conditional requests',
      potential_savings: '10-20% request reduction',
      implementation: 'Store and use ETag headers for GET requests'
    });

    return recommendations;
  }

  /**
   * Calculate variance in daily usage
   */
  calculateVariance(logs) {
    if (logs.length === 0) return 0;

    const dailyUsage = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    const values = Object.values(dailyUsage);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Get detailed cost report
   */
  getDetailedReport() {
    const thirtyDay = this.get30DayUsage();
    const forecast = this.forecast30Days();
    const recommendations = this.getOptimizationRecommendations();

    return {
      period: 'Last 30 Days',
      usage: thirtyDay,
      forecast,
      recommendations,
      generatedAt: new Date(),
      summary: `Used ${thirtyDay.totalCost} API credits in past 30 days. ` +
               `Projected to use ${forecast.projectedCost} in next 30 days.`
    };
  }
}

module.exports = CostAnalyzer;
