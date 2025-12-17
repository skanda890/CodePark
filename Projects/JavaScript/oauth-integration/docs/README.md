# OAuth 2.0 Integration Feature

## Overview

Secure authentication using OAuth 2.0 with multiple providers.

## Installation

```bash
npm install passport passport-oauth2 passport-github passport-google-oauth20
```

## Features

- GitHub OAuth
- Google OAuth
- Token management
- Refresh tokens
- User profile sync

## Configuration

```javascript
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOrCreate({ githubId: profile.id }, (err, user) => {
        return done(err, user);
      });
    },
  ),
);
```

## API Endpoints

```
GET /auth/github - Start OAuth
GET /auth/github/callback - OAuth callback
GET /auth/google - Start OAuth
GET /auth/google/callback - OAuth callback
```

## Environment Variables

```
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

## Security

- HTTPS only
- CSRF protection
- Secure cookies
