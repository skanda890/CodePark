# Advanced Search Feature

## Overview

Implement full-text search with filters and facets.

## Installation

```bash
npm install elasticsearch
```

## Features

- Full-text search
- Faceted search
- Filters
- Sorting
- Pagination
- Auto-complete

## Usage

```javascript
const results = await searchEngine.query({
  text: "javascript",
  filters: {
    category: "tutorial",
    difficulty: "beginner",
  },
  facets: ["category", "difficulty"],
  sort: "-date",
  limit: 20,
  offset: 0,
});
```

## API

```
GET /search?q=query&filters=category:tutorial
```

## Performance

- Indexed search
- Result caching
- Facet optimization

## Testing

```bash
npm test -- search
```
