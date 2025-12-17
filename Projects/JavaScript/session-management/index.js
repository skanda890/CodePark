const crypto = require('crypto');

class SessionManager {
  constructor(options = {}) {
    this.store = new Map();
    this.sessionTimeout = options.sessionTimeout || 24 * 60 * 60 * 1000; // 24 hours
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  createSession(userId, data = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      sessionId,
      userId,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      lastActivity: Date.now()
    };
    this.store.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.store.get(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.store.delete(sessionId);
      return null;
    }

    session.lastActivity = Date.now();
    return session;
  }

  updateSession(sessionId, data) {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.data = { ...session.data, ...data };
    session.lastActivity = Date.now();
    return true;
  }

  destroySession(sessionId) {
    return this.store.delete(sessionId);
  }

  cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of this.store.entries()) {
      if (session.expiresAt < now) {
        this.store.delete(sessionId);
      }
    }
  }

  getAllSessions(userId) {
    const sessions = [];
    for (const session of this.store.values()) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    return sessions;
  }
}

module.exports = SessionManager;
