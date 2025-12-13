# CodePark v2 Deployment Guide

**Last Updated**: December 13, 2025  
**Node.js Version**: 22.0.0+  
**Deployment Status**: Production Ready 🚀

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Deployment](#local-development-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Platform Deployments](#cloud-platform-deployments)
6. [Edge Deployment (Cloudflare Workers)](#edge-deployment-cloudflare-workers)
7. [Environment Configuration](#environment-configuration)
8. [Database Migration](#database-migration)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying CodePark to any environment:

### Required
- [ ] Node.js 22.0.0 or higher installed
- [ ] npm 10.0.0 or higher
- [ ] Git repository cloned
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] Redis instance available
- [ ] MongoDB instance available
- [ ] SSL certificates obtained (production)
- [ ] Domain name configured (production)

### Validation
- [ ] Run `npm run lint` - all code passes linting
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run security-check` - no critical vulnerabilities
- [ ] Run `npm run build` - build succeeds without errors
- [ ] Database migrations reviewed
- [ ] Environment variables validated

### Security
- [ ] Secrets not committed to repository
- [ ] API keys rotated
- [ ] CORS configuration reviewed
- [ ] Rate limiting configured
- [ ] SSL/TLS enabled (production)
- [ ] Firewall rules configured
- [ ] Backup strategy verified

---

## Local Development Deployment

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/skanda890/CodePark.git
cd CodePark

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your local configuration

# 4. Start services (in separate terminals)
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start MongoDB
mongod

# Terminal 3: Start CodePark development server
npm run dev
```

### Access Application

- **Application**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/graphql
- **API Documentation**: http://localhost:3000/api/docs
- **Metrics**: http://localhost:3000/metrics (Prometheus)

### Development Scripts

```bash
# Development with auto-reload
npm run dev

# Development with AI/ML features
npm run dev:ai

# GraphQL server only
npm run graphql

# Production simulation
npm start

# Debug mode
npm run inspect

# Watch tests
npm run test:watch
```

---

## Docker Deployment

### Prerequisites

- Docker Desktop or Docker Engine
- docker-compose (optional but recommended)

### Using Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/skanda890/CodePark.git
cd CodePark

# 2. Configure environment
cp .env.example .env.docker
# Edit .env.docker for Docker configuration

# 3. Build and start services
docker-compose up -d

# 4. Run migrations
docker-compose exec app npm run migrate

# 5. Check logs
docker-compose logs -f app

# 6. Access application
# Application: http://localhost:3000
# GraphQL: http://localhost:4000/graphql
```

### Using Docker CLI Only

```bash
# 1. Build image
docker build -t codepark:latest .

# 2. Run Redis container
docker run -d \
  --name codepark-redis \
  -p 6379:6379 \
  redis:latest

# 3. Run MongoDB container
docker run -d \
  --name codepark-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# 4. Run CodePark container
docker run -d \
  --name codepark-app \
  -p 3000:3000 \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://root:password@codepark-mongo:27017 \
  -e REDIS_URL=redis://codepark-redis:6379 \
  --link codepark-redis \
  --link codepark-mongo \
  codepark:latest
```

### Docker Environment Variables

Create `.env.docker` with:

```bash
# Server
NODE_ENV=production
PORT=3000
GRAPHQL_PORT=4000

# Database
MONGODB_URI=mongodb://root:password@mongo:27017/codepark?authSource=admin
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# API
API_URL=http://localhost:3000
GRAPHQL_ENDPOINT=http://localhost:4000/graphql

# AI/ML
ML_MODEL_PATH=/app/models
TF_FORCE_GPU_ALLOW_GROWTH=true

# Observability
OPENTELEMETRY_ENABLED=true
SENTRY_DSN=your-sentry-dsn
```

### Docker Health Checks

```bash
# Check container health
docker ps | grep codepark

# View logs
docker logs codepark-app -f

# Execute commands in container
docker exec codepark-app npm run migrate

# Stop containers
docker-compose down
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Docker image pushed to registry

### Deployment Steps

#### 1. Create Namespace

```bash
kubectl create namespace codepark
kubectl config set-context --current --namespace=codepark
```

#### 2. Create ConfigMap for Configuration

```bash
kubectl create configmap codepark-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3000 \
  --from-literal=LOG_LEVEL=info
```

#### 3. Create Secrets

```bash
kubectl create secret generic codepark-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=MONGODB_URI=mongodb://user:pass@mongo:27017 \
  --from-literal=REDIS_URL=redis://redis:6379 \
  --from-literal=SENTRY_DSN=your-sentry-dsn
```

#### 4. Deploy Services

```bash
# Create deployment
kubectl apply -f kubernetes/deployment.yaml

# Create service
kubectl apply -f kubernetes/service.yaml

# Create ingress
kubectl apply -f kubernetes/ingress.yaml
```

#### 5. Verify Deployment

```bash
# Check deployment status
kubectl get deployment -n codepark
kubectl get pods -n codepark

# Check service
kubectl get svc -n codepark

# View logs
kubectl logs -n codepark deployment/codepark -f

# Port forward for testing
kubectl port-forward -n codepark svc/codepark 3000:3000
```

### Kubernetes Manifest Example

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codepark
  namespace: codepark
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codepark
  template:
    metadata:
      labels:
        app: codepark
    spec:
      containers:
      - name: codepark
        image: your-registry/codepark:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 4000
          name: graphql
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: codepark-config
              key: NODE_ENV
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: codepark-secrets
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Cloud Platform Deployments

### AWS Deployment

#### Using Elastic Container Service (ECS)

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name codepark

# 2. Build and push image
docker build -t codepark:latest .
aws ecr get-login-password | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag codepark:latest your-account.dkr.ecr.us-east-1.amazonaws.com/codepark:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/codepark:latest

# 3. Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 4. Create ECS service
aws ecs create-service --cluster codepark-cluster --service-name codepark-service --task-definition codepark:1
```

#### Using Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p docker codepark

# 3. Create environment
eb create codepark-env

# 4. Deploy
eb deploy

# 5. Monitor
eb status
eb logs
```

### Azure Deployment

#### Using App Service

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name codepark-rg --location eastus

# 3. Create App Service plan
az appservice plan create --name codepark-plan --resource-group codepark-rg --is-linux

# 4. Create web app
az webapp create --resource-group codepark-rg --plan codepark-plan --name codepark-app --runtime "NODE|22"

# 5. Deploy from GitHub
az webapp deployment source config-zip --resource-group codepark-rg --name codepark-app --src deployment.zip
```

### Google Cloud Deployment

#### Using Cloud Run

```bash
# 1. Enable services
gcloud services enable run.googleapis.com

# 2. Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/codepark

# 3. Deploy
gcloud run deploy codepark --image gcr.io/PROJECT_ID/codepark --platform managed --region us-central1

# 4. View logs
gcloud run logs read codepark
```

---

## Edge Deployment (Cloudflare Workers)

### Prerequisites

- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Setup

```bash
# 1. Login to Cloudflare
wrangler login

# 2. Configure wrangler.toml
cat > wrangler.toml << EOF
name = "codepark-edge"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = "example.com/*"
zone_id = "your-zone-id"

[env.production]
vars = { ENVIRONMENT = "production" }
[env.staging]
vars = { ENVIRONMENT = "staging" }
EOF

# 3. Develop locally
wrangler dev

# 4. Deploy
wrangler deploy --env production
```

### Wrangler Configuration

```toml
name = "codepark-edge"
type = "javascript"
main = "src/index.js"
compatibility_date = "2025-12-13"
account_id = "your-account-id"

[build]
command = "npm run build:edge"

[env.production]
route = "api.example.com/*"
zone_id = "your-zone-id"
vars = { ENVIRONMENT = "production", API_URL = "https://api.example.com" }

[[env.production.routes]]
pattern = "api.example.com/graphql"
zone_id = "your-zone-id"

[env.staging]
route = "staging-api.example.com/*"
zone_id = "your-zone-id"
vars = { ENVIRONMENT = "staging" }
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
GRAPHQL_PORT=4000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://user:password@localhost:27017/codepark
REDIS_URL=redis://localhost:6379
DB_POOL_SIZE=10

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000,https://example.com

# API Configuration
API_URL=http://localhost:3000
GRAPHQL_ENDPOINT=/graphql
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# AI/ML
ML_MODEL_PATH=/app/models
TF_FORCE_GPU_ALLOW_GROWTH=true
TF_CPP_MIN_LOG_LEVEL=2

# Observability
OPENTELEMETRY_ENABLED=true
OPENTELEMETRY_EXPORTER=otlp
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PORT=9090

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com

# Storage (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=codepark-storage

# Cloudflare Workers (if using edge deployment)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=80
GRAPHQL_PORT=443
HOST=0.0.0.0

# Use strong secrets in production
JWT_SECRET=$(openssl rand -base64 32)

# Database connection pooling
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=5000

# Security headers
SECURE_HEADERS=true
HTTPS_REQUIRED=true

# Monitoring
OPENTELEMETRY_ENABLED=true
SENTRY_ENABLED=true

# Performance
CACHE_ENABLED=true
COMPRESSION_ENABLED=true
```

---

## Database Migration

### Running Migrations

```bash
# Run pending migrations
npm run migrate

# Create new migration
npm run migrate:create -- add_new_field

# Rollback last migration
npm run migrate:rollback

# Seed database
npm run seed

# Database status
npm run migrate:status
```

### Backup Database

```bash
# MongoDB backup
mongodump --uri "mongodb://user:password@localhost:27017/codepark" --out ./backups/$(date +%Y%m%d_%H%M%S)

# MongoDB restore
mongorestore --uri "mongodb://user:password@localhost:27017/codepark" ./backups/backup_folder
```

---

## Monitoring & Health Checks

### Health Endpoints

```bash
# Application health
curl http://localhost:3000/health

# Ready check
curl http://localhost:3000/ready

# Metrics
curl http://localhost:3000/metrics

# GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{__typename}"}'
```

### Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (if configured)
- **Sentry**: https://sentry.io/dashboard/
- **OpenTelemetry**: Via configured exporter

### Log Aggregation

```bash
# View application logs
docker logs codepark-app -f

# Kubernetes logs
kubectl logs -n codepark deployment/codepark -f

# systemd logs (if running as service)
sudo journalctl -u codepark -f
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### Database Connection Refused

```bash
# Check MongoDB
mongo --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping

# Verify connection string
echo $MONGODB_URI
echo $REDIS_URL
```

#### Out of Memory

```bash
# Monitor memory
watch -n 1 'free -h'

# Increase Node memory limit
node --max-old-space-size=4096 index.js

# Or set in env
export NODE_OPTIONS='--max-old-space-size=4096'
```

### Getting Help

- **Documentation**: Read [docs/](./)
- **Issues**: Search [GitHub Issues](https://github.com/skanda890/CodePark/issues)
- **Discussions**: Check [GitHub Discussions](https://github.com/skanda890/CodePark/discussions)
- **SECURITY**: Email security@example.com for security issues

---

**Last Updated**: December 13, 2025  
**Next Review**: December 20, 2025
