/**
 * Analytics Engine (Feature #50)
 * Tracks and analyzes application analytics
 */

const crypto = require('crypto');

class AnalyticsEngine {
  constructor(options = {}) {
    this.events = [];
    this.sessions = new Map();
    this.cohorts = new Map();
    this.maxEvents = options.maxEvents || 100000;
  }

  /**
   * Track event
   */
  trackEvent(eventName, userId, properties = {}) {
    const event = {
      id: crypto.randomUUID(),
      name: eventName,
      userId,
      properties,
      timestamp: new Date(),
    };

    this.events.push(event);

    // Keep only maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Update user session
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        userId,
        sessionStart: Date.now(),
        events: [],
      });
    }

    this.sessions.get(userId).events.push(event);

    return event;
  }

  /**
   * Get user journey
   */
  getUserJourney(userId) {
    const session = this.sessions.get(userId);
    return session ? session.events : [];
  }

  /**
   * Define cohort
   */
  defineCohort(name, filter) {
    this.cohorts.set(name, {
      name,
      filter,
      members: new Set(),
      createdAt: new Date(),
    });
  }

  /**
   * Get cohort members
   */
  getCohortMembers(cohortName) {
    const cohort = this.cohorts.get(cohortName);
    if (!cohort) return [];

    // Apply filter to all users
    const members = [];
    for (const [userId, session] of this.sessions) {
      if (cohort.filter(userId, session)) {
        members.push(userId);
      }
    }
    return members;
  }

  /**
   * Get event analytics
   */
  getEventAnalytics(eventName, duration = 86400000) {
    const now = Date.now();
    const recentEvents = this.events.filter(
      (e) => e.name === eventName && now - e.timestamp.getTime() < duration
    );

    return {
      eventName,
      count: recentEvents.length,
      uniqueUsers: new Set(recentEvents.map((e) => e.userId)).size,
      avgPropertiesPerEvent: recentEvents.reduce(
        (sum, e) => sum + Object.keys(e.properties).length,
        0
      ) / recentEvents.length || 0,
    };
  }

  /**
   * Get funnel analytics
   */
  getFunnelAnalytics(steps, duration = 86400000) {
    const now = Date.now();
    const eventsByUser = new Map();

    // Group events by user
    for (const event of this.events) {
      if (now - event.timestamp.getTime() < duration) {
        if (!eventsByUser.has(event.userId)) {
          eventsByUser.set(event.userId, []);
        }
        eventsByUser.get(event.userId).push(event);
      }
    }

    // Calculate funnel
    const funnelData = [];
    for (let i = 0; i < steps.length; i++) {
      let count = 0;
      for (const userEvents of eventsByUser.values()) {
        const userEventNames = userEvents.map((e) => e.name);
        if (userEventNames.includes(steps[i])) {
          count += 1;
        }
      }
      funnelData.push({
        step: steps[i],
        count,
        conversionRate: i === 0 ? 1 : count / (funnelData[i - 1].count || 1),
      });
    }

    return funnelData;
  }
}

module.exports = AnalyticsEngine;