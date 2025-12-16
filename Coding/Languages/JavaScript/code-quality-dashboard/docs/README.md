# 📊 Code Quality Dashboard

Real-time code quality metrics dashboard with ESLint integration, performance analysis, and historical trend tracking using Apache Arrow for columnar storage.

## Features

- 🔍 **Real-time ESLint Analysis**: Analyze code files and get instant quality metrics
- 📈 **Historical Trending**: Track code quality over 30+ days with historical data
- 🔴 **Severity Tracking**: Separate error, warning, and info level metrics
- 📊 **Apache Arrow Integration**: Efficient columnar data storage for analytics
- 🔄 **WebSocket Updates**: Real-time metrics push via Socket.io
- 📡 **GraphQL API**: Query metrics with powerful GraphQL interface
- 📈 **Prometheus Metrics**: Export metrics for monitoring systems

## Installation

```bash
cd Coding/Languages/JavaScript/code-quality-dashboard
npm install
```

## Environment Variables

```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## Usage

```bash
npm start          # Production
npm run dev        # Development
```

## Endpoints

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `POST /graphql` - GraphQL endpoint

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
