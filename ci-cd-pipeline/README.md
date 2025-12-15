# 🚀 CI/CD Pipeline Integration

CI/CD orchestration service for automated build, test, and deployment workflows with Docker container support.

## Features

- 💲 **Docker Integration**: Container builds and deployments
- 📅 **Build Orchestration**: Coordinate build stages
- 🔁 **Automated Testing**: Run tests in pipeline
- 😟 **GitHub Actions Support**: Native GitHub workflow integration
- 💫 **Build Artifacts**: Store and manage build outputs
- 📊 **Build Logs**: Comprehensive build logging
- 🔌 **Status Tracking**: Real-time build status

## Installation

```bash
cd ci-cd-pipeline
npm install
```

## Environment Variables

```env
PORT=3008
DOCKER_HOST=unix:///var/run/docker.sock
NODE_ENV=development
REGISTRY=docker.io
```

## Usage

### Start the Service

```bash
npm start
```

## REST API Endpoints

### POST /build

Trigger a new build.

```bash
curl -X POST http://localhost:3008/build \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "github.com/user/codepark",
    "commit": "abc123def456",
    "branch": "main",
    "dockerfile": "Dockerfile",
    "buildArgs": {
      "NODE_ENV": "production",
      "VERSION": "2.0.0"
    }
  }'
```

**Response:**

```json
{
  "buildId": "build-20251215-xyz",
  "status": "queued",
  "image": "codepark:abc123",
  "timestamp": "2025-12-15T15:30:00Z"
}
```

### GET /status/:buildId

Get build status and logs.

```bash
curl http://localhost:3008/status/build-20251215-xyz
```

**Response:**

```json
{
  "buildId": "build-20251215-xyz",
  "status": "success",
  "duration": 180000,
  "image": "codepark:abc123",
  "logs": [
    "Step 1/10 : FROM node:22-alpine",
    "Step 2/10 : WORKDIR /app",
    "...",
    "Successfully built image codepark:abc123"
  ],
  "artifacts": [
    { "name": "test-results.json", "size": 15240 },
    { "name": "coverage-report.html", "size": 245000 }
  ]
}
```

## Build Pipeline Stages

### Stage 1: Source
```
Clone repository → Checkout commit
```

### Stage 2: Build
```
Docker build → Tag image → Push to registry
```

### Stage 3: Test
```
Unit tests → Integration tests → Security scan
```

### Stage 4: Deploy
```
Deploy to staging → Smoke tests → Deploy to prod
```

## Configuration

### .codepark-ci.yml

```yaml
version: "2.0"
name: CodePark CI/CD

stages:
  - name: build
    docker:
      image: node:22-alpine
      buildArgs:
        NODE_ENV: production
      
  - name: test
    commands:
      - npm test
      - npm run test:security
      
  - name: deploy
    deploy:
      - target: staging
        when: always
      - target: production
        when: tags
```

## Build Examples

### Example 1: Simple Node.js Build

```bash
curl -X POST http://localhost:3008/build \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "github.com/skanda890/CodePark",
    "commit": "abc123",
    "branch": "main",
    "buildArgs": {
      "NODE_ENV": "production"
    }
  }'
```

### Example 2: Multi-stage Build

```dockerfile
# Build stage
FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Webhook Integration

### GitHub Push Event

```javascript
// GitHub webhook payload
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123def456",
      "message": "Add new feature"
    }
  ],
  "repository": {
    "name": "CodePark",
    "url": "https://github.com/skanda890/CodePark"
  }
}

// Triggers CI/CD pipeline automatically
```

## Build Queue Management

```bash
# Get queued builds
curl http://localhost:3008/queue

# Response:
# [
#   { buildId: "build-1", status: "queued", repo: "codepark" },
#   { buildId: "build-2", status: "building", repo: "codepark" }
# ]
```

## Environment Variables for Builds

```json
{
  "BUILD_ID": "build-20251215-xyz",
  "COMMIT_SHA": "abc123def456",
  "BRANCH": "main",
  "REGISTRY_URL": "docker.io",
  "IMAGE_TAG": "codepark:abc123",
  "NODE_ENV": "production",
  "CI": "true"
}
```

## Architecture

```
┌──────────────────────┐
│   GitHub Webhook / API        │
└────────┬──────────────┐
               │
   ┌────────┴────────┐
   │   CI/CD Orchestrator     │
   └────────┬────────┘
               │
    ┌─────────┴─────────┐
    │    Docker Daemon             │
    └───────────────────┘
```

## Performance Metrics

| Metric | Target |
|:---:|:---:|
| Build Startup | < 5s |
| Docker Build | Varies (10-300s) |
| Test Execution | Varies |
| Total Pipeline | Target < 10 min |

## Security

1. **Image Scanning**: Scan images for vulnerabilities
2. **Registry Authentication**: Secure Docker registry access
3. **Build Isolation**: Each build runs in isolated container
4. **Secret Management**: Securely inject secrets
5. **Audit Trail**: Log all build activities

## Troubleshooting

### Docker Build Fails
- Check Docker daemon is running
- Verify Dockerfile syntax
- Check build context and paths
- Review build logs

### Registry Push Issues
- Verify registry credentials
- Check image tag format
- Ensure registry is accessible

### Tests Failing
- Run tests locally first
- Check test dependencies
- Review test logs from build

## Dependencies

- `express@next` - Web framework
- `dockerode@next` - Docker API client

## Future Enhancements

- [ ] Kubernetes deployment support
- [ ] GitLab CI/CD integration
- [ ] Helm chart packaging
- [ ] Build caching optimization
- [ ] Matrix builds

## License

MIT
