# Two-Factor Authentication Feature

## Overview

Implement 2FA with TOTP and backup codes.

## Installation

```bash
npm install speakeasy
```

## Features

- TOTP generation
- QR codes
- Backup codes
- Recovery

## Usage

```javascript
const secret = speakeasy.generateSecret({
  name: "CodePark",
  issuer: "CodePark",
});

const verified = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: "base32",
  token: userToken,
  window: 2,
});
```
