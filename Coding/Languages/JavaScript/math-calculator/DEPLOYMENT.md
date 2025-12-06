# Deployment Guide

## Quick Start

### Local Development

Install dependencies
npm install

Start in development mode (verbose logging)
npm run dev

Server runs at http://localhost:4000
text

### Production Deployment

Set environment
export NODE_ENV=production
export PORT=80

Install production dependencies
npm install --production

Start server
npm start

text

## Environment Setup

### Environment Variables

Math Calculator API uses the following environment variables:

#### NODE_ENV (Application Mode)

Controls logging verbosity and application behavior:

- `development` - Verbose logging with debug messages, includes detailed error info
- `production` - Minimal logging (errors and warnings only), hides sensitive details
- `silent` - No logging output at all

**Default**: `development`

#### HOST (Network Access)

Controls which interface the server listens on:

- Not set / `localhost` - Local access only (default)
- Any hostname/IP - External access enabled

**Default**: `localhost` (local only)

#### PORT (Server Port)

Port number for the server:

**Default**: `4000`

### Example Usage

**Development Mode (Verbose, Local)**:

NODE_ENV=development npm run dev

text

Output: Full debug logging, development-friendly error messages

**Production Mode (Minimal, External)**:

NODE_ENV=production HOST=0.0.0.0 PORT=80 npm start

text

Output: Only errors and warnings, sanitized error messages, accessible from any host

**Silent Mode (No Logs)**:

NODE_ENV=silent npm start

text

Output: No console output, metrics endpoint still works

### Logging Behavior

**Important Note**: Expressions are NEVER logged by default. The logging system only tracks:

- Expression length (not content)
- Error messages (without expression details)
- Request counts and timing
- Cache statistics

This protects user privacy and prevents sensitive data leaks.

**Development-only Logging**: In `development` mode only, debug messages include expression length for optimization purposes. Expression content is never logged in any mode.

---

## Security Considerations

1. **CSP Headers**
   - Scripts: 'self' and 'unsafe-inline'
   - Styles: 'self' and 'unsafe-inline'
   - Consider using nonces in production

2. **Rate Limiting**
   - General: 100 req/15min
   - Calculate: 20 req/min
   - Adjust based on requirements

3. **Input Validation**
   - Max expression length: 10,000 chars
   - Dangerous patterns blocked
   - Vieta iterations: max 1000

---

## Docker Deployment

### Dockerfile

FROM node:18-alpine

WORKDIR /app

Copy package files
COPY package*.json ./

Install dependencies
RUN npm install --production

Copy application
COPY . .

Expose port
EXPOSE 4000

Set environment
ENV NODE_ENV=production

Start server
CMD ["npm", "start"]

text

### Build & Run

Build image
docker build -t math-calculator:2.0.0 .

Run container (local)
docker run -p 4000:4000 math-calculator:2.0.0

Run container (external access)
docker run -p 80:4000 -e NODE_ENV=production -e HOST=0.0.0.0 math-calculator:2.0.0

text

---

## Cloud Deployment

### Heroku

Create Procfile
echo "web: npm start" > Procfile

Set environment
heroku config:set NODE_ENV=production
heroku config:set HOST=0.0.0.0

Deploy
git push heroku main

text

### AWS Lambda

Install serverless
npm install -g serverless

Deploy
serverless deploy

text

### Google Cloud Run

Deploy
gcloud run deploy math-calculator
--source .
--platform managed
--region us-central1
--set-env-vars NODE_ENV=production,HOST=0.0.0.0

text

---

## Monitoring

### Health Checks

Configure health check endpoint
GET /health

Expected response
{
"status": "healthy",
"timestamp": "2025-12-06T11:00:00Z",
"uptime": 3600000
}

text

### Metrics

Monitor performance
GET /metrics

Returns
{
"requestCount": 150,
"errorCount": 8,
"avgCalculationTime": "12.50ms"
}

text

### Logging

Development mode (verbose)
NODE_ENV=development npm start

Output: [DEBUG], [INFO], [WARN], [ERROR]
Production mode (minimal)
NODE_ENV=production npm start

Output: [WARN], [ERROR] only
Silent mode (no output)
NODE_ENV=silent npm start

Output: None (except to /metrics endpoint)
text

---

## Performance Optimization

### Caching Strategy

- In-memory cache: 100 recent calculations
- Cache key: Base64-encoded expression
- TTL: Unlimited (LRU eviction)

### Load Balancing

upstream math_calculator {
server localhost:4000;
server localhost:4001;
server localhost:4002;
}

server {
listen 80;
location / {
proxy_pass http://math_calculator;
}
}

text

### Horizontal Scaling

Run multiple instances
PORT=4000 npm start &
PORT=4001 npm start &
PORT=4002 npm start &

Use load balancer to distribute traffic
text

---

## Maintenance

### Update Dependencies

Check for updates
npm run update:deps

Or use latest versions (with caution)
npm run update:latest

Run security audit
npm run audit

text

### Version Updates

Bump version
npm version minor

Push to repository
git push origin main

text

---

## Troubleshooting

### High Memory Usage

Check cache size
GET /metrics

Clear cache: Restart server
npm stop && npm start

text

### Rate Limit Issues

Use batch endpoint for multiple queries
POST /calculate/batch with max 10 expressions
text

### Calculation Timeouts

Reduce Vieta iterations
Use simple expressions
Check server resources
text

---

## Rollback

Revert to previous version
git revert <commit-hash>
npm install
npm start

text

---

## Security Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure rate limits
- [ ] Enable HTTPS/TLS
- [ ] Review CSP headers
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test disaster recovery
- [ ] Run security audit
- [ ] Rotate credentials
- [ ] Document procedures