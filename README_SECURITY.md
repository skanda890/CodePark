# 🔒 CodePark Security Guide

## Quick Start - Security Setup

### 1. Install Dependencies

```bash
# Install all packages (including new security middleware)
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

### 3. Run Security Check

```bash
# Check for vulnerabilities
npm run security-check

# View detailed audit
npm audit
```

### 4. Start Server

```bash
# Development mode (with detailed logs)
npm run dev

# Production mode
NODE_ENV=production npm start
```

---

## 🔍 Security Features

### HTTP Security Headers (Helmet.js)

Automatically applied to all responses:

| Header | Purpose | Value |
|--------|---------|-------|
| `Content-Security-Policy` | Prevents XSS attacks | Restrictive CSP |
| `Strict-Transport-Security` | Forces HTTPS | 1 year, includeSubDomains |
| `X-Frame-Options` | Prevents clickjacking | SAMEORIGIN |
| `X-Content-Type-Options` | Prevents MIME sniffing | nosniff |
| `X-DNS-Prefetch-Control` | Controls DNS prefetching | off |

### Rate Limiting

Protects against abuse and DoS attacks:

#### General API Rate Limit
```
100 requests per 15 minutes per IP
```

#### Game Creation Rate Limit
```
20 games per 5 minutes per IP
```

**Test rate limiting:**
```bash
# This will eventually get rate limited
for i in {1..105}; do 
  curl http://localhost:3000/health
  echo "Request $i"
done
```

### Input Validation

All inputs are validated using `express-validator`:

**Example - Game Check Endpoint:**
```javascript
{
  "gameId": "string, required, non-empty",
  "guess": "integer, 1-100, required"
}
```

**Invalid requests return 400 with details:**
```json
{
  "error": "Validation failed",
  "details": [
    "guess must be an integer between 1 and 100"
  ]
}
```

### Memory Management

Prevents memory exhaustion:

- **Max concurrent games**: 1,000
- **Game expiry**: 10 minutes
- **Cleanup interval**: Every 60 seconds
- **Auto-cleanup**: Expired games removed automatically

**Monitor active games:**
```bash
curl http://localhost:3000/health
```

Response includes:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T12:00:00.000Z",
  "activeGames": 5,
  "uptime": 3600
}
```

---

## ⚠️ Experimental Package Monitoring

### Why Pre-release Versions?

This project uses `next` and `latest` tags for:

✅ **Latest features** - Access newest functionality immediately  
✅ **Bug fixes** - Get fixes before stable release  
✅ **Performance** - Cutting-edge optimizations  
✅ **Experimentation** - Test upcoming breaking changes  

### Risks

⚠️ **Instability** - Pre-release code may have bugs  
⚠️ **Breaking changes** - APIs may change without notice  
⚠️ **Security** - New vulnerabilities not yet discovered  
⚠️ **Documentation** - Features may be undocumented  

### Mitigation Strategy

1. **Daily Security Scans**
   - Automated GitHub Actions workflow
   - Checks for new vulnerabilities
   - Alerts on critical issues

2. **Multiple Security Tools**
   - npm audit
   - Snyk
   - CodeQL
   - Semgrep
   - Dependabot

3. **Locked Versions**
   - `package-lock.json` committed to repo
   - Ensures reproducible builds
   - Explicit version resolution

4. **Regular Updates**
   ```bash
   # Update all 'next' packages and check security
   npm run update:experimental
   ```

### Monitoring Commands

```bash
# Check for vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Update and audit
npm run update:experimental

# View dependency tree
npm list

# Check specific package
npm info express@next
```

---

## 🚪 API Security Guide

### Authentication (Not Implemented)

⚠️ **Current Status**: No authentication

**For production, add:**
- JWT tokens
- API keys
- OAuth 2.0
- Session management

**Example with JWT:**
```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Protect endpoints
app.get('/game/guess', authenticateToken, (req, res) => {
  // ...
});
```

### CORS Configuration

**Current**: Allows all origins (`*`)

**For production:**
```bash
# In .env
ALLOWED_ORIGIN=https://yourdomain.com
```

**Or configure multiple origins:**
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

### HTTPS/TLS

⚠️ **Required for production!**

**Option 1: Reverse Proxy (Recommended)**
```nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**Option 2: Built-in HTTPS**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

---

## 🐛 Common Security Issues

### 1. Memory Leaks

**Problem**: Unbounded data structures

**Solution**: Implemented in this version
- Max games limit
- Automatic cleanup
- TTL-based expiration

### 2. Rate Limit Bypass

**Problem**: Attackers using multiple IPs

**Additional Protection**:
```javascript
// Use X-Forwarded-For if behind proxy
app.set('trust proxy', 1);

// Or use Redis for distributed rate limiting
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  // ...
});
```

### 3. Input Injection

**Problem**: SQL/NoSQL/Command injection

**Protection**: express-validator on all inputs

**Best practices**:
```javascript
// ✅ DO: Validate and sanitize
body('email').isEmail().normalizeEmail(),
body('name').trim().escape(),

// ❌ DON'T: Trust user input
const query = `SELECT * FROM users WHERE id = ${req.body.id}`;
```

### 4. Error Information Leakage

**Problem**: Exposing stack traces in production

**Solution**: Implemented
```javascript
const isDevelopment = process.env.NODE_ENV !== 'production';

res.json({
  error: "Internal server error",
  message: isDevelopment ? err.message : "Something went wrong"
});
```

---

## 🚨 Incident Response

### If You Discover a Vulnerability

1. **DO NOT** open a public issue
2. Email: skanda890@users.noreply.github.com
3. Include:
   - Description
   - Reproduction steps
   - Impact assessment
   - Potential fix

### If a Dependency Has a Vulnerability

1. **Check severity**:
   ```bash
   npm audit
   ```

2. **For critical vulnerabilities**:
   ```bash
   # Try auto-fix first
   npm audit fix
   
   # If that fails, force major version updates
   npm audit fix --force
   
   # Last resort: manual update
   npm update <package-name>
   ```

3. **Test thoroughly** after updates

4. **Monitor** for breaking changes

### Emergency Patching

```bash
# 1. Create emergency branch
git checkout -b emergency-patch

# 2. Fix the issue
npm install safe-package@version

# 3. Test
npm test
npm run dev  # Manual testing

# 4. Commit and push
git commit -am "Emergency security patch"
git push origin emergency-patch

# 5. Create PR and merge immediately
# 6. Deploy to production
```

---

## 📊 Security Metrics

### Monitor These Metrics

1. **Vulnerability Count**
   - Critical: 0 (Target)
   - High: 0 (Target)
   - Medium: < 5

2. **Rate Limit Triggers**
   - Track how often limits are hit
   - Adjust if legitimate traffic affected

3. **Error Rates**
   - Monitor 4xx and 5xx responses
   - Investigate spikes

4. **Memory Usage**
   - Active games count
   - Heap usage
   - Memory leaks

5. **Response Times**
   - Latency increases may indicate attacks

### Monitoring Tools

```bash
# Check memory usage
node --expose-gc index.js

# Monitor with PM2
pm2 start index.js --name codepark
pm2 monit

# Log to file
node index.js > app.log 2>&1
```

---

## 🛡️ Defense in Depth

### Layer 1: Network
- Firewall rules
- DDoS protection (Cloudflare)
- IP whitelisting

### Layer 2: Application (This Project)
- Rate limiting ✅
- Input validation ✅
- Security headers ✅
- Error handling ✅

### Layer 3: Data
- Encryption at rest
- Encryption in transit (HTTPS)
- Access controls
- Audit logging

### Layer 4: Monitoring
- Security scanning ✅
- Dependency checks ✅
- Log analysis
- Alerting

---

## 📚 Additional Resources

### Security Guides
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [NPM Security](https://docs.npmjs.com/about-security-audits)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [GitHub Security](https://github.com/security)
- [OWASP ZAP](https://www.zaproxy.org/)

### Training
- [Web Security Academy](https://portswigger.net/web-security)
- [Node.js Security Course](https://nodejs.org/en/docs/guides/)

---

## ✅ Security Checklist

### Before Deploying

- [ ] Run `npm audit` (0 critical, 0 high)
- [ ] Environment variables configured
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting tested
- [ ] Error messages don't leak info
- [ ] CORS properly configured
- [ ] Authentication implemented (if needed)
- [ ] Monitoring/alerting set up
- [ ] Backups configured
- [ ] Incident response plan ready

### Regular Maintenance

- [ ] Daily security scans (automated)
- [ ] Weekly dependency updates
- [ ] Monthly security review
- [ ] Quarterly penetration testing
- [ ] Annual security audit

---

**Remember**: Security is an ongoing process, not a one-time fix. Stay vigilant! 🔍
