# 📊 Code Quality Dashboard

Real-time code quality metrics dashboard with ESLint integration, performance analysis, and historical trend tracking using Apache Arrow for columnar storage.

## Features

- 🔍 **Real-time ESLint Analysis**: Analyze code files and get instant quality metrics
- 📈 **Historical Trending**: Track code quality over 30+ days with historical data
- 🔴 **Severity Tracking**: Separate error, warning, and info level metrics
- 📊 **Apache Arrow Integration**: Efficient columnar data storage for analytics
- 🔄 **WebSocket Updates**: Real-time metrics push via Socket.io
- 📡 **GraphQL API**: Query metrics with powerful GraphQL interface
- 📉 **Prometheus Metrics**: Export metrics for monitoring systems

## Installation

```bash
cd code-quality-dashboard
npm install
```

## Environment Variables

```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## Usage

### Start the Service

```bash
npm start          # Production
npm run dev        # Development with file watching
```

### REST API Endpoints

#### Get Code Quality Metrics

```bash
curl http://localhost:3001/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { metrics(limit: 100) { totalFiles totalIssues errorCount warningCount overallScore } }"
  }'
```

#### Response Example

```json
{
  "data": {
    "metrics": {
      "timestamp": "2025-12-15T15:30:00Z",
      "totalFiles": 145,
      "totalIssues": 28,
      "errorCount": 3,
      "warningCount": 25,
      "averageComplexity": 7.2,
      "overallScore": 72.5,
      "files": [
        {
          "path": "src/index.js",
          "issueCount": 2,
          "errorCount": 1,
          "warningCount": 1,
          "complexity": 8.5,
          "coverage": 85.3
        }
      ]
    }
  }
}
```

### GraphQL Queries

#### Query All Metrics

```graphql
query GetMetrics {
  metrics(limit: 100) {
    timestamp
    totalFiles
    totalIssues
    errorCount
    warningCount
    averageComplexity
    overallScore
    files {
      path
      issueCount
      errorCount
      warningCount
      complexity
      coverage
    }
  }
}
```

#### Query Issues by Severity

```graphql
query GetErrors {
  issues(severity: ERROR) {
    id
    file
    line
    column
    message
    rule
  }
}
```

#### Query Trend Data

```graphql
query GetTrend {
  trend(days: 30) {
    date
    issueCount
    score
  }
}
```

### GraphQL Mutations

#### Run Analysis

```graphql
mutation RunAnalysis {
  runAnalysis(paths: ["src/**/*.js", "tests/**/*.js"]) {
    totalFiles
    totalIssues
    overallScore
  }
}
```

#### Fix Issues Automatically

```graphql
mutation FixIssues {
  fixIssues(ruleIds: ["no-var", "semi"]) 
}
```

### WebSocket Events

#### Connect and Request Analysis

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  // Request code analysis
  socket.emit('request-analysis', ['src/**/*.js']);
});

socket.on('analysis-started', () => {
  console.log('Analysis in progress...');
});

socket.on('analysis-complete', (metrics) => {
  console.log('Analysis complete:', metrics);
});

socket.on('metrics-updated', (metrics) => {
  console.log('Real-time update:', metrics);
});
```

## Metrics Endpoint

Export Prometheus metrics:

```bash
curl http://localhost:3001/metrics
```

## Architecture

```
┌─────────────────────────────────────┐
│     Apollo GraphQL Server           │
│     + Real-time Subscriptions       │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────┐       ┌─────────────┐
│  ESLint  │       │ Socket.io   │
│ Analysis │       │ WebSocket   │
└─────┬────┘       └─────────────┘
      │
      ▼
┌──────────────────────┐
│   Redis Cache        │
│  (300s TTL)          │
└──────────────────────┘
```

## Performance Tips

1. **Caching**: Metrics are cached in Redis for 5 minutes
2. **Batch Analysis**: Analyze multiple files in one request
3. **Selective Rules**: Configure ESLint to run only relevant rules
4. **Incremental Updates**: Only re-analyze changed files

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## Troubleshooting

### Redis Connection Failed
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL environment variable

### ESLint Not Finding Files
- Verify ESLint configuration in `.eslintrc.json`
- Check file paths are correct and relative

### GraphQL Query Errors
- Validate query syntax in GraphQL playground
- Check resolver error logs

## Dependencies

- `express@next` - Web framework
- `@apollo/server@next` - GraphQL server
- `eslint@next` - Code linting
- `apache-arrow@next` - Columnar data storage
- `ioredis@next` - Redis client
- `socket.io@next` - WebSocket support
- `prom-client@next` - Prometheus metrics

## License

MIT
