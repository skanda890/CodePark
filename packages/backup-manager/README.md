# CodePark Backup Manager

Multi-cloud backup management with encryption, compression, and disaster recovery.

## Features

- ✅ AWS S3 integration
- ✅ Local storage backup
- ✅ AES-256 file encryption
- ✅ GZIP compression
- ✅ Upload/download progress tracking
- ✅ Incremental backups
- ✅ Backup verification
- ✅ Disaster recovery tools

## Installation

```bash
cd packages/backup-manager
npm install
```

## Configuration

### AWS S3

```javascript
const manager = new CloudStorageManager('aws', {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  bucket: 'my-backup-bucket',
  region: 'us-east-1'
});
```

### Local Storage

```javascript
const manager = new CloudStorageManager('local', {
  storagePath: '/path/to/backup/storage'
});
```

## Usage

### Upload

```javascript
const CloudStorageManager = require('./src/backup-manager');

const manager = new CloudStorageManager('aws', {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  bucket: 'backups'
});

await manager.upload('data.zip', 'backups/2025-12-06/data.zip', {
  compress: true,
  password: 'secure-password'
});
```

### Download

```javascript
await manager.download(
  'backups/2025-12-06/data.zip',
  'restore/data.zip',
  'secure-password'
);
```

### List Backups

```javascript
const backups = await manager.listBackups('backups/2025-12-06/');
console.log(backups);
```

## Architecture

```
src/
├── backup-manager.js   # Main manager
├── cloud-adapters/    # Provider implementations
└── encryption/        # Encryption utilities
```

## Supported Providers

- AWS S3
- Local Storage
- (Google Drive - coming soon)
- (OneDrive - coming soon)
- (Dropbox - coming soon)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
