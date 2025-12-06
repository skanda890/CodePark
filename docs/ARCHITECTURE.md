# CodePark Architecture Guide

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Deployment Architecture](#deployment-architecture)
6. [Scalability & Performance](#scalability--performance)
7. [Security Architecture](#security-architecture)
8. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

CodePark follows a **layered microservices architecture** with edge computing capabilities, real-time communication, and AI/ML integration. The system is designed for high performance, scalability, and developer experience.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Edge Layer (Cloudflare)                  │
│                    WebAssembly • Workers                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      API Gateway Layer                       │
│         Express • GraphQL (Apollo) • REST • WebSocket       │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
    ┌──────────▼─────────┐    ┌──────────▼──────────┐
    │  Business Logic    │    │   Real-Time Layer   │
    │  • AI/ML (TF.js)   │    │   • Socket.io       │
    │  • NLP Processing  │    │   • Yjs CRDT        │
    │  • Job Queue       │    │   • Live Cursors    │
    └──────────┬─────────┘    └──────────┬──────────┘
               │                          │
    ┌──────────▼──────────────────────────▼──────────┐
    │              Data Layer                         │
    │  MongoDB • Redis • Prisma ORM • Kafka          │
    └──────────┬────────────────────────────────────┘
               │
    ┌──────────▼──────────────────────────────────┐
    │         Observability Layer                  │
    │  OpenTelemetry • Prometheus • Sentry        │
    └─────────────────────────────────────────────┘
```

### Key Design Principles

- **Scalability First**: Horizontal scaling at every layer
- **Real-Time by Default**: WebSocket and CRDT for instant updates
- **AI-Enhanced**: Machine learning integrated throughout
- **Edge-Optimized**: Static assets and compute at the edge
- **Observable**: Comprehensive metrics, tracing, and logging
- **Secure**: Defense in depth with multiple security layers

---

## Architecture Layers

### 1. Edge Layer

**Purpose**: Reduce latency by serving content from locations closest to users.

**Technologies**:

- Cloudflare Workers (serverless edge compute)
- WebAssembly (WASM) modules for high-performance operations
- Edge caching (static assets, API responses)

**Responsibilities**:

- Static asset delivery (CDN)
- Edge computing for lightweight operations
- DDoS protection and rate limiting
- SSL/TLS termination
- Geographic routing

**Benefits**:

- <50ms latency for edge operations
- Global distribution without infrastructure management
- Automatic scaling based on demand
- Built-in security features

---

### 2. API Gateway Layer

**Purpose**: Unified entry point for all client requests.

**Technologies**:

- Express.js (HTTP server)
- Apollo Server v4 (GraphQL)
- Socket.IO (WebSocket)
- Express-GraphQL (hybrid endpoints)

**Responsibilities**:

- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- API versioning
- Protocol translation (REST ↔ GraphQL)

**API Types**:

#### REST API

```javascript
GET    /api/v1/projects          # List projects
POST   /api/v1/projects          # Create project
GET    /api/v1/projects/:id      # Get project
PUT    /api/v1/projects/:id      # Update project
DELETE /api/v1/projects/:id      # Delete project
```

#### GraphQL API

```graphql
query GetProjects {
  projects {
    id
    name
    collaborators {
      id
      name
    }
    aiInsights {
      complexity
      suggestions
    }
  }
}
```

#### WebSocket Events

```javascript
// Client → Server
socket.emit("code-change", { projectId, content });
socket.emit("cursor-move", { position, userId });

// Server → Client
socket.on("code-update", (data) => {
  /* ... */
});
socket.on("user-joined", (user) => {
  /* ... */
});
```

---

### 3. Business Logic Layer

**Purpose**: Core application logic and AI/ML processing.

**Components**:

#### AI/ML Module

- **TensorFlow.js**: Model inference (code completion, bug prediction)
- **Natural**: NLP for text analysis
- **Compromise**: Language understanding
- **Sentiment**: Code review sentiment analysis

**Use Cases**:

- Code completion suggestions
- Bug prediction from commit history
- Code quality scoring
- Documentation generation
- Automated code review

#### Job Queue (BullMQ)

- Asynchronous task processing
- Background jobs (email, notifications)
- Scheduled tasks (data cleanup, reports)
- Retry logic with exponential backoff

**Queue Types**:

```javascript
// High priority queue (user-facing)
const criticalQueue = new Queue("critical", {
  defaultJobOptions: { priority: 1 },
});

// Low priority queue (background tasks)
const backgroundQueue = new Queue("background", {
  defaultJobOptions: { priority: 10 },
});
```

#### Event Streaming (Kafka)

- Real-time event processing
- Audit logging
- Analytics pipeline
- Inter-service communication

---

### 4. Real-Time Layer

**Purpose**: Enable collaborative features and live updates.

**Technologies**:

- **Socket.IO**: Bidirectional WebSocket communication
- **Yjs**: Conflict-free Replicated Data Types (CRDT)
- **y-websocket**: WebSocket provider for Yjs

**Features**:

#### Live Collaboration

```javascript
const Y = require("yjs");
const ydoc = new Y.Doc();
const ytext = ydoc.getText("shared-code");

// Multiple users editing simultaneously
ytext.insert(0, "function hello() {");
// No conflicts, automatic merging
```

#### Presence System

- Online/offline status
- Active cursors
- User locations in documents
- Typing indicators

#### Real-Time Notifications

- Instant alerts for mentions
- Code review updates
- Build status changes
- System announcements

---

### 5. Data Layer

**Purpose**: Persistent and temporary data storage.

**Technologies**:

#### MongoDB (Primary Database)

- **Use Case**: Document storage for projects, users, files
- **Schema**: Flexible JSON documents
- **Scaling**: Replica sets and sharding
- **Indexing**: Compound indexes for performance

**Example Schema**:

```javascript
{
  _id: ObjectId,
  name: String,
  owner: ObjectId,
  collaborators: [ObjectId],
  files: [{
    path: String,
    content: String,
    version: Number
  }],
  aiInsights: {
    complexity: Number,
    suggestions: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Redis (Cache & Session Store)

- **Use Case**: Session management, caching, pub/sub
- **Data Structures**: Strings, Hashes, Lists, Sets, Sorted Sets
- **Persistence**: RDB snapshots + AOF logs

**Caching Strategy**:

```javascript
// Cache-aside pattern
const data = await redis.get(key);
if (!data) {
  data = await database.find(query);
  await redis.setex(key, 3600, JSON.stringify(data));
}
```

#### Prisma ORM

- Type-safe database access
- Auto-generated TypeScript types
- Migration management
- Connection pooling

**Example Model**:

```prisma
model Project {
  id            String   @id @default(cuid())
  name          String
  owner         User     @relation(fields: [ownerId], references: [id])
  ownerId       String
  collaborators User[]   @relation("ProjectCollaborators")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Apache Kafka

- Event streaming platform
- High-throughput message processing
- Event sourcing and CQRS patterns

---

### 6. Observability Layer

**Purpose**: Monitor, trace, and debug the system.

**Technologies**:

#### OpenTelemetry

- Distributed tracing across services
- Context propagation
- Automatic instrumentation

**Trace Example**:

```javascript
const tracer = trace.getTracer("codepark");

async function processRequest(req) {
  const span = tracer.startSpan("process-request");
  span.setAttribute("user.id", req.user.id);

  try {
    // ... processing ...
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  } finally {
    span.end();
  }
}
```

#### Prometheus

- Time-series metrics collection
- Custom business metrics
- Alerting rules

**Metrics**:

```javascript
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});
```

#### Sentry

- Error tracking and reporting
- Performance monitoring
- Release tracking
- User feedback

---

## Component Details

### Authentication & Authorization

**Flow**:

```
1. User Login
   ↓
2. Validate Credentials (Argon2)
   ↓
3. Check 2FA (if enabled)
   ↓
4. Generate JWT (Access + Refresh)
   ↓
5. Return Tokens
```

**JWT Structure**:

```javascript
{
  "access_token": {
    "sub": "user_id",
    "email": "user@example.com",
    "roles": ["user", "admin"],
    "exp": 1234567890,
    "iat": 1234567000
  },
  "refresh_token": {
    "sub": "user_id",
    "type": "refresh",
    "exp": 1234577890
  }
}
```

**Two-Factor Authentication**:

```javascript
const speakeasy = require("speakeasy");

// Setup
const secret = speakeasy.generateSecret();
const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// Verification
const verified = speakeasy.totp.verify({
  secret: user.mfaSecret,
  encoding: "base32",
  token: userProvidedToken,
  window: 1,
});
```

---

### Rate Limiting Strategy

**Tier-based Limits**:

| Tier       | Requests/Min | Burst | WebSocket Connections |
| ---------- | ------------ | ----- | --------------------- |
| Anonymous  | 60           | 10    | 5                     |
| Free User  | 300          | 30    | 20                    |
| Pro User   | 1,200        | 100   | 100                   |
| Enterprise | Unlimited    | 500   | 1,000                 |

**Implementation**:

```javascript
const rateLimiter = new RateLimiterService({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => getTierLimit(req.user),
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

---

### Caching Strategy

**Cache Levels**:

1. **Edge Cache** (Cloudflare): Static assets (1 week TTL)
2. **Application Cache** (Redis): API responses (5-60 min TTL)
3. **Database Cache**: Query result cache (Prisma)

**Cache Invalidation**:

```javascript
// Write-through cache
async function updateProject(id, data) {
  await database.update(id, data);
  await cache.del(`project:${id}`);
  await cache.del("projects:list");
}

// Cache-aside (lazy loading)
async function getProject(id) {
  const cached = await cache.get(`project:${id}`);
  if (cached) return cached;

  const project = await database.findById(id);
  await cache.setex(`project:${id}`, 300, project);
  return project;
}
```

---

## Data Flow

### Typical Request Flow

```
1. Client Request
   ↓
2. Edge Layer (Cloudflare)
   ├─ Static Assets → Return from CDN
   └─ API Request → Continue
   ↓
3. API Gateway
   ├─ Authentication (JWT validation)
   ├─ Rate Limiting (check limits)
   └─ Route to handler
   ↓
4. Business Logic
   ├─ Check Cache (Redis)
   ├─ Database Query (if cache miss)
   ├─ AI Processing (if needed)
   └─ Format Response
   ↓
5. Response
   ├─ Update Cache
   ├─ Log Metrics (OpenTelemetry)
   └─ Return to Client
```

### Real-Time Collaboration Flow

```
1. User Types in Editor
   ↓
2. Yjs Updates Local Document
   ↓
3. Yjs Generates Update Message
   ↓
4. WebSocket Sends to Server
   ↓
5. Server Broadcasts to Room
   ↓
6. Other Clients Receive Update
   ↓
7. Yjs Applies Updates Locally
   ↓
8. UI Updates (conflict-free)
```

### AI/ML Processing Flow

```
1. Code Submitted
   ↓
2. Tokenize & Vectorize
   ↓
3. Load TensorFlow Model
   ↓
4. Run Inference
   ↓
5. Post-process Results
   ↓
6. Return Suggestions
```

---

## Deployment Architecture

### Production Deployment

```
┌──────────────────────────────────────────────┐
│         Load Balancer (HAProxy/Nginx)        │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌───▼────┐
   │ Node 1 │      │ Node 2 │  (PM2 Cluster)
   └───┬────┘      └───┬────┘
       │                │
       └───────┬────────┘
               │
    ┌──────────▼──────────┐
    │   Redis Cluster     │
    │   (Master+Replicas) │
    └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │  MongoDB Replica Set│
    │  (Primary+Secondary)│
    └─────────────────────┘
```

### Container Orchestration (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codepark-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codepark-api
  template:
    metadata:
      labels:
        app: codepark-api
    spec:
      containers:
        - name: api
          image: codepark/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
```

### Docker Compose (Development)

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/codepark
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

volumes:
  mongo-data:
```

---

## Scalability & Performance

### Horizontal Scaling

**Stateless Application Servers**:

- Multiple API server instances behind load balancer
- Session stored in Redis (shared state)
- No server affinity required

**Database Scaling**:

- MongoDB sharding for data distribution
- Read replicas for read-heavy workloads
- Separate analytics database

**Redis Scaling**:

- Redis Cluster for data partitioning
- Separate Redis instances for different use cases:
  - Session store
  - Cache
  - Job queue
  - Pub/Sub

### Performance Optimizations

**Connection Pooling**:

```javascript
const pool = {
  min: 10,
  max: 100,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};
```

**Database Indexing**:

```javascript
// Compound indexes for common queries
db.projects.createIndex({ ownerId: 1, createdAt: -1 });
db.projects.createIndex({ "collaborators.userId": 1 });
db.projects.createIndex({ name: "text" });
```

**Query Optimization**:

```javascript
// Use projection to limit fields
db.projects.find({ ownerId: userId }, { name: 1, createdAt: 1, _id: 1 });

// Use aggregation for complex queries
db.projects.aggregate([
  { $match: { ownerId: userId } },
  {
    $lookup: {
      from: "users",
      localField: "collaborators",
      foreignField: "_id",
      as: "collaboratorData",
    },
  },
  { $project: { name: 1, collaboratorCount: { $size: "$collaborators" } } },
]);
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Edge Protection**

- DDoS protection (Cloudflare)
- WAF rules
- Bot detection
- Geographic filtering

**Layer 2: API Gateway**

- Rate limiting
- Input validation
- JWT verification
- CORS policies

**Layer 3: Application**

- Authentication (JWT + 2FA)
- Authorization (RBAC)
- Data encryption (at rest and in transit)
- Secure headers (Helmet.js)

**Layer 4: Data**

- Encrypted connections (TLS 1.3)
- Field-level encryption
- Regular backups
- Access audit logs

### Security Headers

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

---

## Monitoring & Observability

### Key Metrics

**Application Metrics**:

- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active WebSocket connections
- AI inference time

**Infrastructure Metrics**:

- CPU usage (%)
- Memory usage (MB)
- Disk I/O (IOPS)
- Network bandwidth (Mbps)

**Business Metrics**:

- Active users (DAU/MAU)
- Projects created
- Collaboration sessions
- AI suggestions accepted

### Alerting Rules

```yaml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 response time > 2s"
```

### Logging Strategy

**Log Levels**:

- **ERROR**: Application errors, exceptions
- **WARN**: Potential issues, deprecated usage
- **INFO**: Important events, state changes
- **DEBUG**: Detailed debugging information
- **TRACE**: Very detailed tracing information

**Structured Logging**:

```javascript
const logger = require("pino")({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info({ userId, projectId, action: "create" }, "Project created");
```

---

## Disaster Recovery

### Backup Strategy

**Database Backups**:

- Full backup: Daily at 2 AM UTC
- Incremental backup: Every 6 hours
- Retention: 30 days
- Off-site storage: AWS S3 / Google Cloud Storage

**Redis Backups**:

- RDB snapshots: Every hour
- AOF logs: Continuous
- Retention: 7 days

**Recovery Time Objectives**:

- **RTO** (Recovery Time Objective): < 1 hour
- **RPO** (Recovery Point Objective): < 15 minutes

### High Availability

**Application Tier**:

- Multi-zone deployment
- Auto-scaling groups
- Health checks and auto-recovery

**Database Tier**:

- MongoDB replica set (3 nodes minimum)
- Automatic failover
- Read preference: primaryPreferred

**Cache Tier**:

- Redis Cluster with sentinel
- Automatic failover
- Multi-AZ deployment

---

## Migration Strategy

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_ai_insights

# Apply migration (production)
npx prisma migrate deploy

# Rollback (manual)
mongo codepark --eval "db.migrations.deleteOne({version: '20231201120000'})"
```

### Zero-Downtime Deployment

```
1. Deploy New Version (Blue)
   ↓
2. Run Health Checks
   ↓
3. Gradually Shift Traffic (10% → 50% → 100%)
   ↓
4. Monitor Error Rates
   ↓
5. Complete Cutover or Rollback
   ↓
6. Decommission Old Version (Green)
```

---

## Future Enhancements

### Planned Features

- **Service Mesh** (Istio/Linkerd): Advanced traffic management
- **GraphQL Federation**: Distributed schema composition
- **Event Sourcing**: Complete audit trail with event replay
- **ML Model Versioning**: A/B testing for AI models
- **Multi-Region Deployment**: Global distribution
- **Blockchain Integration**: Immutable audit logs

### Technology Radar

**Adopt**:

- Bun runtime (alternative to Node.js)
- Deno for edge functions
- SolidJS for frontend

**Trial**:

- tRPC (type-safe APIs)
- Temporal (workflow orchestration)
- Vector databases (Pinecone, Weaviate)

**Assess**:

- Web3 integration
- Quantum-resistant cryptography
- Federated learning

---

## Appendix

### Glossary

- **CRDT**: Conflict-free Replicated Data Type
- **CQRS**: Command Query Responsibility Segregation
- **DAU/MAU**: Daily/Monthly Active Users
- **IOPS**: Input/Output Operations Per Second
- **JWT**: JSON Web Token
- **NLP**: Natural Language Processing
- **ORM**: Object-Relational Mapping
- **RBAC**: Role-Based Access Control
- **RTO/RPO**: Recovery Time/Point Objective
- **TOTP**: Time-based One-Time Password
- **WASM**: WebAssembly

### References

- [Express.js Documentation](https://expressjs.com/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Maintained By**: CodePark Architecture Team
