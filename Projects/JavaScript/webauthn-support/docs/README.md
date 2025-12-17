# WebAuthn/FIDO2 Support Feature

## Overview

Implement passwordless authentication using WebAuthn.

## Installation

```bash
npm install @simplewebauthn/server
```

## Features

- User registration
- Authentication
- Device management
- Challenge verification

## Usage

```javascript
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");

const options = await generateRegistrationOptions({
  rpID: "example.com",
  rpName: "Example App",
  userID: userId,
  userName: userEmail,
});
```

## API

```
POST /webauthn/register - Start registration
POST /webauthn/verify-registration - Verify credential
POST /webauthn/authenticate - Start authentication
POST /webauthn/verify-auth - Verify authentication
```
