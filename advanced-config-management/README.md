# ⚙️ Advanced Configuration Management

Centralized configuration and secret management service supporting multi-environment configurations, feature flags, and secret rotation.

## Features

- 📄 **Multi-Environment Config**: Separate configs for dev, staging, prod
- 🔓 **Secret Management**: Centralized secret storage and rotation
- 🜐 **Feature Flags**: LaunchDarkly-style feature flag management
- 🔄 **Hot Reloading**: Config changes without restart
- 🔍 **Audit Trail**: Track all configuration changes
- 📋 **Versioning**: Configuration version control
- 🐒 **Webhooks**: Notify services on config changes

## Installation

```bash
cd advanced-config-management
npm install
```

## Environment Variables

```env
PORT=3005
NODE_ENV=development
CONFIG_STORAGE=memory  # or redis, database
```

## Usage

### Start the Service

```bash
npm start
```

## REST API Endpoints

### PUT /config/:env/:service

Update configuration for a service in specific environment.

```bash
curl -X PUT http://localhost:3005/config/production/api-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "maxRequestSize": "100mb",
    "rateLimit": 1000,
    "timeout": 30000,
    "retries": 3
  }'
```

**Response:**

```json
{
  "status": "updated",
  "service": "api-gateway",
  "environment": "production",
  "timestamp": "2025-12-15T15:30:00Z"
}
```

### GET /config/:env/:service

Retrieve configuration.

```bash
curl http://localhost:3005/config/production/api-gateway
```

**Response:**

```json
{
  "maxRequestSize": "100mb",
  "rateLimit": 1000,
  "timeout": 30000,
  "retries": 3
}
```

### GET /flags/:env

Retrieve all feature flags for environment.

```bash
curl http://localhost:3005/flags/production
```

**Response:**

```json
{
  "newDashboard": true,
  "betaAI": false,
  "advancedAnalytics": true,
  "experimentalAPI": false
}
```

## Configuration Structure

### Service Configuration

```json
{
  "serviceName": "code-quality-dashboard",
  "environment": "production",
  "config": {
    "redis": {
      "url": "redis://prod-redis:6379",
      "ttl": 3600,
      "retryStrategy": "exponential"
    },
    "elasticsearch": {
      "host": "prod-es.internal",
      "port": 9200,
      "indices": {
        "metrics": "metrics-prod",
        "logs": "logs-prod"
      }
    },
    "api": {
      "timeout": 30000,
      "rateLimit": 5000
    }
  }
}
```

### Feature Flags

```json
{
  "flags": {
    "newUI": {
      "enabled": true,
      "rollout": 100,
      "targeting": {
        "users": ["user-1", "user-2"],
        "groups": ["beta-testers"]
      }
    },
    "expensiveFeature": {
      "enabled": true,
      "rollout": 10
    }
  }
}
```

## Usage Examples

### Example 1: Service Configuration

```javascript
const axios = require('axios');

// Get current config
const config = await axios.get('http://localhost:3005/config/production/my-service');

// Use in application
const { redis, api } = config.data;
const client = new Redis(redis.url);
```

### Example 2: Feature Flags

```javascript
const flags = await axios.get('http://localhost:3005/flags/production');

if (flags.data.newDashboard) {
  // Use new dashboard
  loadNewDashboard();
} else {
  // Use legacy dashboard
  loadLegacyDashboard();
}
```

### Example 3: A/B Testing

```json
{
  "experimentName": "checkout-flow",
  "variants": {
    "control": {
      "enabled": true,
      "rollout": 50
    },
    "experimental": {
      "enabled": true,
      "rollout": 50
    }
  }
}
```

## Environment Hierarchy

```
development
    │
    └─ staging
            │
            └─ production
```

Inheritance:
- Production config is base
- Staging overrides production for specific keys
- Development overrides everything

## Rollout Strategies

### Percentage-Based

```json
{
  "newFeature": {
    "enabled": true,
    "rollout": 25  // 25% of users
  }
}
```

### User Targeting

```json
{
  "betaFeature": {
    "enabled": true,
    "targeting": {
      "users": ["alice@example.com", "bob@example.com"]
    }
  }
}
```

### Group-Based

```json
{
  "premiumFeature": {
    "enabled": true,
    "targeting": {
      "groups": ["premium-users", "beta-testers"]
    }
  }
}
```

## Architecture

```
┌──────────────────────────┐
│   Config Management API      │
│   (Express.js)              │
└────────┬───────────────┘
               │
    ┌────────┴────────┐
    │  Config Store Layer    │
    │  (Redis / Database)    │
    └─────────────────┘
```

## Security Best Practices

1. **Secrets Encryption**: Encrypt sensitive values at rest
2. **Access Control**: Role-based access to configs
3. **Audit Logging**: Log all config changes
4. **Versioning**: Keep config history for rollback
5. **Secret Rotation**: Automatic secret key rotation

## Performance

- **Query Time**: < 5ms (cached)
- **Write Time**: < 50ms
- **Cache TTL**: 5 minutes default
- **Consistency**: Eventually consistent across replicas

## Troubleshooting

### Config Not Updating
- Check if service is using cached version
- Verify config key is correct
- Check environment name

### Feature Flag Not Applied
- Verify flag name matches exactly
- Check rollout percentage
- Ensure targeting rules are correct

## Dependencies

- `express@next` - Web framework
- `dotenv@next` - Environment variable management

## License

MIT
