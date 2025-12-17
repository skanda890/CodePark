# OpenTelemetry Tracing Feature

## Overview

Distributed tracing with OpenTelemetry.

## Installation

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-jaeger
```

## Configuration

```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-trace-jaeger');

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});
```
