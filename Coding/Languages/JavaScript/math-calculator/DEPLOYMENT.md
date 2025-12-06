# Deployment Guide

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Server runs at http://localhost:4000
```

### Production Deployment

```bash
# Set environment
export NODE_ENV=production
export PORT=80

# Install production dependencies
npm install --production

# Start server
npm start
```

## Environment Setup

### Environment Variables

```bash
# Required
NODE_ENV=production        # development, production, or silent

# Optional
PORT=4000                  # Port number (default: 4000)
LOG_LEVEL=info            # info, debug, warn, error
```

### Security Considerations

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

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application
COPY . .

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
```

### Build & Run

```bash
# Build image
docker build -t math-calculator:2.0.0 .

# Run container
docker run -p 4000:4000 math-calculator:2.0.0
```

## Cloud Deployment

### Heroku

```bash
# Create Procfile
echo "web: npm start" > Procfile

# Deploy
git push heroku main
```

### AWS Lambda

```bash
# Install serverless
npm install -g serverless

# Deploy
serverless deploy
```

### Google Cloud Run

```bash
# Deploy
gcloud run deploy math-calculator \
  --source . \
  --platform managed \
  --region us-central1
```

## Monitoring

### Health Checks

```bash
# Configure health check endpoint
GET /health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-12-06T11:00:00Z",
  "uptime": 3600000
}
```

### Metrics

```bash
# Monitor performance
GET /metrics

# Returns
{
  "requestCount": 150,
  "errorCount": 8,
  "avgCalculationTime": "12.50ms"
}
```

### Logging

```bash
# Set log level
export NODE_ENV=development   # Verbose logging
export NODE_ENV=silent       # No logging

# View logs
logs:
  - [INFO] Request: POST /calculate
  - [DEBUG] Cache hit for expression
  - [ERROR] Calculation error: Division by zero
```

## Performance Optimization

### Caching Strategy

- In-memory cache: 100 recent calculations
- Cache key: Base64-encoded expression
- TTL: Unlimited (LRU eviction)

### Load Balancing

```nginx
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
```

### Horizontal Scaling

```bash
# Run multiple instances
PORT=4000 npm start &
PORT=4001 npm start &
PORT=4002 npm start &

# Use load balancer to distribute traffic
```

## Maintenance

### Update Dependencies

```bash
# Check for updates
npm run update:deps

# Or use latest versions (with caution)
npm run update:latest

# Run security audit
npm run audit
```

### Database Backup

No database required. Cache is in-memory and ephemeral.

### Version Updates

```bash
# Bump version
npm version minor

# Push to repository
git push origin main
```

## Troubleshooting

### High Memory Usage

```bash
# Check cache size
GET /metrics

# Clear cache
# Restart server: npm stop && npm start
```

### Rate Limit Issues

```bash
# Temporarily increase limits
# Modify CONFIG in server.js

# Or use pagination:
# POST /calculate/batch with max 10 expressions
```

### Calculation Timeouts

```bash
# Reduce Vieta iterations
# Use simple expressions
# Check server resources
```

## Rollback

```bash
# Revert to previous version
git revert <commit-hash>
npm install
npm start
```

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
