# 📈 Analytics & Insights Engine

High-performance analytics engine powered by Apache Arrow for efficient columnar data storage and real-time analytics queries.

## Features

- 📊 **Columnar Storage**: Apache Arrow for efficient data representation
- ⚡ **Real-time Analytics**: Fast aggregations and queries
- 📈 **Time-Series Data**: Optimized for time-based events
- 📉 **OLAP Queries**: Complex analytical queries
- 📥 **Data Ingestion**: Batch and streaming support
- 📤 **Export Formats**: Parquet, CSV, JSON export
- 🔐 **Data Compression**: Zstd compression for storage efficiency

## Installation

```bash
cd Coding/Languages/JavaScript/analytics-insights-engine
npm install
```

## Environment Variables

```env
PORT=3006
STORAGE_PATH=./data
NODE_ENV=development
```

## Usage

```bash
npm start
```

## Endpoints

- `POST /ingest` - Ingest events
- `GET /query` - Execute analytical queries

## Query Examples

- Time-Series Aggregation
- User Analytics
- Performance Metrics

## Performance

- Simple aggregation: < 100ms
- Time-series (7d): < 500ms
- Full dataset scan: < 5s

## Dependencies

- `express@next` - Web framework
- `apache-arrow@next` - Columnar data format

## License

MIT
