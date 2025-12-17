# Bulk Import Feature

## Overview

Import large datasets efficiently.

## Installation

```bash
npm install csv-parser papaparse
```

## Features

- CSV import
- JSON import
- Validation
- Error handling
- Progress tracking
- Batch processing

## Usage

```javascript
const importer = new BulkImporter();

const result = await importer.importCSV('data.csv', {
  batchSize: 1000,
  skipValidation: false
});

console.log(`Imported: ${result.imported} records`);
```

## Supported Formats

- CSV
- JSON
- JSONL

## API

```
POST /import
Content-Type: multipart/form-data

File: data.csv
Format: csv
BatchSize: 1000
```

## Error Handling

- Validation errors tracked
- Failed records saved
- Rollback support
