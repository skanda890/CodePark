# 📈 Analytics & Insights Engine

High-performance analytics engine powered by Apache Arrow for efficient columnar data storage and real-time analytics queries.

## Features

- 📊 **Columnar Storage**: Apache Arrow for efficient data representation
- ⚡ **Real-time Analytics**: Fast aggregations and queries
- 📉 **Time-Series Data**: Optimized for time-based events
- 💻 **OLAP Queries**: Complex analytical queries
- 🔠 **Data Ingestion**: Batch and streaming support
- 📜 **Export Formats**: Parquet, CSV, JSON export
- 🔓 **Data Compression**: Zstd compression for storage efficiency

## Installation

```bash
cd analytics-insights-engine
npm install
```

## Environment Variables

```env
PORT=3006
STORAGE_PATH=./data
NODE_ENV=development
```

## Usage

### Start the Service

```bash
npm start
```

## REST API Endpoints

### POST /ingest

Ingest events into analytics engine.

```bash
curl -X POST http://localhost:3006/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "timestamp": "2025-12-15T15:30:00Z",
        "userId": "user-123",
        "event": "code-review",
        "duration": 300,
        "status": "approved"
      },
      {
        "timestamp": "2025-12-15T15:35:00Z",
        "userId": "user-456",
        "event": "deployment",
        "duration": 120,
        "status": "success"
      }
    ]
  }'
```

**Response:**

```json
{
  "status": "ingested",
  "count": 2,
  "timestamp": "2025-12-15T15:30:00Z"
}
```

### GET /query

Execute analytical queries.

```bash
curl "http://localhost:3006/query?metric=totalEvents&groupBy=event&period=hour"
```

**Response:**

```json
{
  "metrics": {
    "totalEvents": 15420,
    "activeUsers": 342,
    "avgSessionDuration": 450,
    "successRate": 94.2
  },
  "breakdown": {
    "code-review": { "count": 5230, "avgDuration": 320 },
    "deployment": { "count": 3120, "avgDuration": 280 },
    "build": { "count": 7070, "avgDuration": 180 }
  }
}
```

## Query Examples

### Time-Series Aggregation

```bash
curl "http://localhost:3006/query?metric=events&groupBy=hour&startDate=2025-12-01&endDate=2025-12-15"
```

Returns hourly event counts for the period.

### User Analytics

```bash
curl "http://localhost:3006/query?metric=activeUsers&groupBy=day&filter=status:success"
```

Returns daily active user count for successful events.

### Performance Metrics

```bash
curl "http://localhost:3006/query?metric=avgDuration&groupBy=event&percentile=p95"
```

Returns 95th percentile duration by event type.

## Data Model

### Arrow Table Schema

```
Schema {
  timestamp: Timestamp(ms),
  userId: Utf8,
  event: Utf8,
  duration: Int64,
  status: Utf8,
  metadata: Struct {
    ip: Utf8,
    userAgent: Utf8,
    region: Utf8
  }
}
```

### Event Structure

```json
{
  "timestamp": "2025-12-15T15:30:00Z",
  "userId": "user-123",
  "event": "code-review",
  "duration": 300,
  "status": "approved",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "region": "us-west"
  }
}
```

## Analytics Patterns

### Funnel Analysis

```javascript
const funnelQuery = {
  steps: [
    { event: 'page-view', count: 10000 },
    { event: 'code-view', count: 5500 },
    { event: 'code-fork', count: 1200 },
    { event: 'pull-request', count: 450 }
  ]
};

// Calculates conversion: 5500/10000 = 55% -> 1200/5500 = 21.8% -> etc.
```

### Cohort Analysis

```javascript
const cohortQuery = {
  cohortDate: '2025-12-01',
  metric: 'retention',
  buckets: {
    'day0': 1000,
    'day1': 850,
    'day7': 420,
    'day30': 120
  }
};
```

### Attribution Modeling

```javascript
const attribution = {
  models: {
    'first-touch': 0.25,
    'last-touch': 0.25,
    'linear': 0.25,
    'time-decay': 0.25
  }
};
```

## Performance Characteristics

| Query Type | Performance | Notes |
|:---:|:---:|:---:|
| Simple aggregation | < 100ms | Cached results |
| Time-series (7d) | < 500ms | Column-optimized |
| Cohort analysis | < 1s | Complex joins |
| Full dataset scan | < 5s | Depends on size |

## Architecture

```
┌────────────────────────┐
│    Event Ingestion API      │
└────────┬───────────────┘
               │
   ┌────────┴────────┐
   │  Arrow Table Store    │
   │  (Columnar Format)     │
   └────────┬────────┘
               │
   ┌────────┴────────┐
   │ Query Engine         │
   │ (OLAP)                │
   └─────────────────┘
```

## Data Export

### Export to Parquet

```bash
curl -X GET "http://localhost:3006/export?format=parquet&startDate=2025-12-01&endDate=2025-12-15" \
  -o analytics-2025-12.parquet
```

### Export to CSV

```bash
curl -X GET "http://localhost:3006/export?format=csv&startDate=2025-12-01" \
  -o analytics.csv
```

## Storage Optimization

- **Zstd Compression**: High compression ratio with fast decompression
- **Column Pruning**: Only load required columns
- **Partitioning**: Data organized by date for faster queries
- **Caching**: Recent queries cached in memory

## Dependencies

- `express@next` - Web framework
- `apache-arrow@next` - Columnar data format

## Use Cases

1. **Team Productivity**: Track code review cycles, deployment frequency
2. **Quality Metrics**: Monitor bug trends, test coverage
3. **Performance Analysis**: API latency, resource utilization
4. **User Behavior**: Feature adoption, retention cohorts
5. **Business Intelligence**: Revenue, customer metrics

## License

MIT
