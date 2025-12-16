# 📅 Advanced Audit Logging

Comprehensive audit logging service with OpenTelemetry integration for compliance (GDPR/CCPA), tracing, and immutable audit trails.

## Features

- 💫 **Distributed Tracing**: OpenTelemetry integration for request tracking
- 🗑 **Immutable Audit Trail**: Append-only event log
- 🔐 **Compliance Ready**: GDPR, CCPA, and SOC2 support
- 📬 **Event Classification**: Categorize events by type and severity
- 🔓 **Data Retention**: Configurable retention policies
- 📊 **Analytics**: Audit log analysis and reporting
- 💵 **High Performance**: Winston-based logging at scale

## Installation

```bash
cd advanced-audit-logging
npm install
```

## Environment Variables

```env
PORT=3007
NODE_ENV=development
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Usage

### Start the Service

```bash
npm start
```

## REST API Endpoints

### POST /log

Log an audit event.

```bash
curl -X POST http://localhost:3007/log \
  -H "Content-Type: application/json" \
  -d '{
    "action": "user-created",
    "userId": "admin-123",
    "resource": "users/user-456",
    "details": {
      "email": "newuser@example.com",
      "role": "contributor"
    }
  }'
```

**Response:**

```json
{
  "status": "logged",
  "eventId": "evt-20251215-xyz123",
  "timestamp": "2025-12-15T15:30:00Z",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

### GET /logs

Retrieve audit logs.

```bash
curl "http://localhost:3007/logs?startDate=2025-12-01&endDate=2025-12-15&action=user-created&limit=100"
```

## Audit Event Types

### User Management

```javascript
{
  "action": "user-created",
  "userId": "admin-123",
  "resource": "users/user-456",
  "severity": "info",
  "details": {
    "email": "user@example.com",
    "role": "member"
  }
}
```

### Data Access

```javascript
{
  "action": "data-exported",
  "userId": "user-789",
  "resource": "projects/proj-123",
  "severity": "warning",
  "details": {
    "format": "csv",
    "recordCount": 50000
  }
}
```

### Security Events

```javascript
{
  "action": "failed-login",
  "userId": "unknown",
  "resource": "auth/login",
  "severity": "critical",
  "details": {
    "ip": "192.168.1.100",
    "reason": "invalid-password",
    "attempts": 3
  }
}
```

### Configuration Changes

```javascript
{
  "action": "config-updated",
  "userId": "admin-123",
  "resource": "config/api-gateway",
  "severity": "warning",
  "details": {
    "field": "rateLimit",
    "oldValue": 1000,
    "newValue": 500
  }
}
```

## Log Schema

```json
{
  "eventId": "string (unique identifier)",
  "timestamp": "ISO 8601 timestamp",
  "action": "string (action type)",
  "severity": "info | warning | critical",
  "userId": "string (actor)",
  "resource": "string (affected resource)",
  "details": {
    "key1": "value1",
    "key2": "value2"
  },
  "traceId": "string (distributed trace ID)",
  "ipAddress": "string (source IP)",
  "userAgent": "string"
}
```

## OpenTelemetry Integration

### Span Creation

```javascript
const { trace } = require("@opentelemetry/api");
const tracer = trace.getTracer("audit-service");

const span = tracer.startSpan("log_audit_event");
span.setAttributes({
  action: "user-created",
  severity: "info",
  resource: "users/123",
});
span.end();
```

### Trace Context

```javascript
{
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "traceFlags": "01"
}
```

## Compliance Features

### GDPR Compliance

```javascript
// Data subject access requests
{
  "action": "subject-access-request",
  "userId": "dpo-admin",
  "resource": "users/user-456",
  "details": {
    "requestId": "req-123",
    "dataSubject": "user-456",
    "requestDate": "2025-12-15"
  }
}

// Right to be forgotten
{
  "action": "data-deletion-request",
  "userId": "dpo-admin",
  "resource": "users/user-456",
  "severity": "critical",
  "details": {
    "reason": "user-requested"
  }
}
```

### Data Retention

```json
{
  "retentionPolicies": {
    "user-created": { "days": 2555 },
    "failed-login": { "days": 90 },
    "data-exported": { "days": 365 },
    "data-deletion": { "days": 2555 }
  }
}
```

## Analytics

### Event Statistics

```bash
curl "http://localhost:3007/analytics?metric=event-count&groupBy=action&period=day"
```

**Response:**

```json
{
  "period": "2025-12-15",
  "breakdown": {
    "user-created": 12,
    "user-deleted": 3,
    "failed-login": 45,
    "data-exported": 7
  },
  "total": 67
}
```

### User Activity

```bash
curl "http://localhost:3007/analytics?metric=user-activity&userId=admin-123&days=30"
```

## Architecture

```
┌────────────────────────┐
│    Audit Event API (Express)    │
└────────┬───────────────┘
               │
   ┌────────┴────────┐
   │  Winston Logger     │
   └────────┬────────┘
               │
   ┌─────────┴─────────┐
   │ OpenTelemetry SDK   │
   └────────┬─────────┘
               │
   ┌────────┴────────┐
   │ Immutable Store    │
   │ (Database/File)    │
   └─────────────────┘
```

## Security Best Practices

1. **Access Control**: Restrict audit log access to compliance team
2. **Encryption**: Encrypt logs at rest and in transit
3. **Immutability**: Prevent log tampering or deletion
4. **Integrity Verification**: Hash-based integrity checks
5. **Regular Audits**: Review audit logs for suspicious activity

## Performance

- **Logging Latency**: < 10ms
- **Query Performance**: < 500ms for 1M records
- **Storage**: ~1KB per audit event (compressed)
- **Throughput**: 10,000+ events/sec

## Troubleshooting

### OpenTelemetry Not Connecting

- Check OTEL_EXPORTER_OTLP_ENDPOINT is correct
- Verify collector is running
- Check firewall rules

### Logs Not Appearing

- Check LOG_LEVEL setting
- Verify Winston configuration
- Check storage permissions

## Dependencies

- `express@next` - Web framework
- `winston@next` - Logging library
- `@opentelemetry/api@next` - Tracing API

## License

MIT
