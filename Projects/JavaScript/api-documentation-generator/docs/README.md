# API Documentation Generator Feature

## Overview

Generate API documentation automatically.

## Installation

```bash
npm install swagger-jsdoc swagger-ui-express
```

## Usage

```javascript
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3000' }]
  },
  apis: ['./routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```
