# Security Best Practices

## JWT Configuration

### Separate Secrets (Recommended)

```bash
# .env
JWT_SECRET=<strong-random-access-secret>
JWT_REFRESH_SECRET=<strong-random-refresh-secret>
```

**Why?**
- Access tokens exposed more frequently (every API call)
- Refresh tokens stored longer term
- Separate secrets limit blast radius of compromise
- Can rotate access secret without invalidating refresh tokens

**Generate Strong Secrets**:

```bash
# Using OpenSSL
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Token Expiry

```bash
# Short-lived access tokens
JWT_EXPIRY=15m   # 15 minutes (recommended for high-security)
JWT_EXPIRY=1h    # 1 hour (balanced)
JWT_EXPIRY=24h   # 24 hours (default, less secure)

# Long-lived refresh tokens
JWT_REFRESH_EXPIRY=7d   # 7 days (recommended)
JWT_REFRESH_EXPIRY=30d  # 30 days (acceptable)
```

**Trade-offs**:
- Shorter = more secure, more refresh requests
- Longer = less secure, better UX

## Rate Limiting

### Redis-Backed (Production)

```bash
REDIS_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

**Benefits**:
- Distributed rate limiting across multiple servers
- Persistent across restarts
- Prevents coordinated attacks

### In-Memory (Development)

```bash
REDIS_ENABLED=false
```

**Limitations**:
- Per-instance only
- Lost on restart
- Attackers can bypass by hitting different servers

## CORS Configuration

### Production

```bash
# Whitelist specific origins
ALLOWED_ORIGIN=https://app.example.com,https://admin.example.com
```

### Development

```bash
# Allow all origins (DEV ONLY!)
ALLOWED_ORIGIN=*
```

## Cache Security

### Sensitive Data

**DO NOT cache**:
- Authentication tokens
- Personal information
- Financial data
- Session data

**Safe to cache**:
- Public game statistics
- Leaderboards
- Static content
- Rate limit counters (in Redis)

### Redis Password

```bash
# Always use password in production
REDIS_PASSWORD=<strong-random-password>
```

## Helmet Configuration

Already configured with secure defaults:

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

## WebSocket Security

### Authentication

```javascript
// Option 1: Query parameter
const ws = new WebSocket('ws://localhost:3000/ws?token=<jwt>');

// Option 2: In initial message
ws.send(JSON.stringify({
  type: 'auth',
  token: '<jwt>'
}));
```

### Message Validation

Always validate incoming messages:

```javascript
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    // Validate message structure
  } catch (error) {
    // Reject invalid messages
  }
});
```

## Environment Variables

### Never Commit

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### Production Secrets

Use secret management:
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets
- Azure Key Vault

## Monitoring

### Failed Auth Attempts

```javascript
// Set up alerts for:
- High rate of 401 responses
- Failed token verifications
- Invalid refresh token attempts
```

### Health Check Security

```javascript
// Restrict health endpoints
app.use('/health', ipWhitelist(['10.0.0.0/8']));

// Or use separate internal port
const internalApp = express();
internalApp.use('/health', healthRoutes);
internalApp.listen(8080); // Internal only
```

## Security Checklist

- [ ] Strong JWT secrets configured
- [ ] Separate access/refresh secrets
- [ ] Short token expiry times
- [ ] Redis password set
- [ ] CORS whitelist configured
- [ ] Rate limiting enabled
- [ ] HTTPS in production
- [ ] Helmet headers active
- [ ] WebSocket auth required
- [ ] Secrets not in code
- [ ] Health endpoints restricted
- [ ] Monitoring/alerts configured
- [ ] Regular security audits (`npm audit`)
- [ ] Dependency updates automated

## Incident Response

### Compromised JWT Secret

1. Generate new secret immediately
2. Deploy with new secret
3. All existing tokens invalidated
4. Users must re-authenticate
5. Review logs for suspicious activity

### Redis Breach

1. Change Redis password
2. Restart Redis with new password
3. Update application config
4. Review cached data for exposure
5. Clear cache if sensitive data present

### DDoS Attack

1. Rate limiting will help mitigate
2. Consider Cloudflare/AWS Shield
3. Scale horizontally if needed
4. Block attacking IPs
5. Review and tighten rate limits

## Regular Maintenance

```bash
# Weekly
npm audit
npm outdated

# Monthly
# Rotate JWT secrets
# Review access logs
# Update dependencies

# Quarterly
# Security audit
# Penetration testing
# Review configurations
```
