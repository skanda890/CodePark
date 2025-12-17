const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2');
const GoogleStrategy = require('passport-google-oauth20');

class OAuthManager {
  constructor(config = {}) {
    this.config = config;
    this.setupStrategies();
  }

  setupStrategies() {
    // Local Strategy
    passport.use('local', new LocalStrategy(
      { usernameField: 'email' },
      (email, password, done) => {
        this.validateUser(email, password)
          .then(user => done(null, user))
          .catch(err => done(err));
      }
    ));

    // GitHub Strategy
    passport.use('github', new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
      this.findOrCreateUser(profile, 'github')
        .then(user => done(null, user))
        .catch(err => done(err));
    }));

    // Google Strategy
    passport.use('google', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
      this.findOrCreateUser(profile, 'google')
        .then(user => done(null, user))
        .catch(err => done(err));
    }));

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
      this.getUserById(id)
        .then(user => done(null, user))
        .catch(err => done(err));
    });
  }

  async validateUser(email, password) {
    // Validate user credentials
    return {
      id: Math.random().toString(),
      email,
      authenticated: true
    };
  }

  async findOrCreateUser(profile, provider) {
    return {
      id: profile.id,
      email: profile.emails?.[0]?.value || profile.email,
      name: profile.displayName || profile.name,
      provider,
      profile
    };
  }

  async getUserById(id) {
    return { id, email: 'user@example.com' };
  }

  getAuthMiddleware() {
    return passport.initialize();
  }
}

module.exports = OAuthManager;
