# SAML 2.0 SSO Feature

## Overview

Enterprise Single Sign-On using SAML 2.0.

## Installation

```bash
npm install passport-saml
```

## Features

- SAML authentication
- Identity provider integration
- Metadata generation
- Assertion validation

## Configuration

```javascript
passport.use(new SAMLStrategy({
  entryPoint: process.env.SAML_ENTRY_POINT,
  issuer: process.env.SAML_ISSUER,
  cert: fs.readFileSync('./cert/saml.crt', 'utf-8')
}, (profile, done) => {
  User.findOrCreate({ samlId: profile.uid }, (err, user) => {
    return done(err, user);
  });
}));
```

## Endpoints

```
GET /auth/saml - Initiate SAML
POST /auth/saml/callback - SAML callback
GET /auth/saml/metadata - SP metadata
```
