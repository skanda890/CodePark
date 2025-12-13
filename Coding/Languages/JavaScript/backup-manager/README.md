# Backup Manager

A powerful backup and restore utility for Node.js with support for file backup, incremental backups, metadata tracking, and integrity verification.

## Features

### Core Functionality
- **Create Backups**: Full or incremental file/folder backups with automatic organization
- **Restore Backups**: Restore files from any previous backup point
- **List Backups**: View all created backups with timestamps and metadata
- **Verify Integrity**: Check backup integrity using file hashing (MD5)
- **Delete Backups**: Safely remove old backups to free up space
- **Export Apps**: Generate installation commands for installed applications

### Advanced Features
- **Incremental Backups**: Only backup changed files using MD5 hashing to save space
- **Metadata Tracking**: Maintain detailed backup history and file information
- **Hash Verification**: Detect corrupted or modified files in backups
- **Recursive Directory Support**: Handle nested directories automatically
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Error Recovery**: Graceful handling of permission errors and missing files

## Installation

```bash
npm install
```

## Usage

### Quick Start

```bash
npm start
```

This will launch an interactive CLI menu with the following options:

```
Backup Manager - What would you like to do?
  ❯ Create Backup
    Restore Backup
    List Backups
    Verify Backup
    Delete Backup
    Export Installed Apps
    Exit
```

## Commands

### 1. Create Backup

Create a new backup of your files.

**Prompts:**
- `Backup name`: Give your backup a descriptive name
- `Source path`: Full path to the directory you want to backup
- `Use compression`: Enable compression (reserved for future versions)
- `Incremental backup`: Skip unchanged files to save space

**Example:**
```
Backup name: my-project-v1
Source path: /home/user/projects/myapp
Use compression: no
Incremental backup: yes
```

**Output:**
```
✓ Backup created successfully!
  Location: /home/user/.backup-manager/backups/my-project-v1
  Files backed up: 245
  Total size: 15.32 MB
```

### 2. Restore Backup

Restore files from a previous backup.

**Steps:**
1. Select a backup from the list
2. Specify the restoration directory
3. Files will be copied to the specified location

**Output:**
```
✓ Restoration completed!
  Location: /home/user/restored-project
  Files restored: 245
```

### 3. List Backups

View all available backups with details.

**Output:**
```
Total backups: 3

1. my-project-v1 [FULL]
   Created: 12/13/2025, 4:18 PM
   Files: 245
   Path: /home/user/.backup-manager/backups/my-project-v1

2. my-project-v2 [INC]
   Created: 12/13/2025, 5:30 PM
   Files: 15
   Path: /home/user/.backup-manager/backups/my-project-v2
```

Backup types:
- `[FULL]`: Complete backup of all files
- `[INC]`: Incremental backup (only changed files)

### 4. Verify Backup

Check backup integrity by verifying file hashes.

**Process:**
1. Select a backup to verify
2. Script compares stored MD5 hashes with actual file hashes
3. Reports valid and corrupted files

**Output:**
```
Verifying backup: my-project-v1

✓ Verification complete!
  Valid files: 245
  Total files: 245

✓ All files verified successfully!
```

### 5. Delete Backup

Remove a backup and free up disk space.

**Safety:**
- Confirmation prompt before deletion
- Displays backup information
- Action cannot be undone

### 6. Export Installed Apps

Generate a list of installed applications and installation commands.

**Platform-Specific Output:**

**Windows:**
- Creates `.bat` file
- Uses Chocolatey or WinGet commands

**macOS:**
- Creates `.sh` file
- Uses Homebrew commands

**Linux:**
- Creates `.sh` file
- Uses apt-get commands

## Configuration

### Backup Storage

Backups are stored in: `~/.backup-manager/`

Directory structure:
```
~/.backup-manager/
├── backups.json          # Global backup metadata
└── backups/
    ├── my-project-v1/
    │   ├── metadata.json # Backup metadata
    │   └── files/        # Actual backed up files
    └── my-project-v2/
        ├── metadata.json
        └── files/
```

### Metadata Format

**Global Metadata** (`backups.json`):
```json
{
  "backups": [
    {
      "name": "my-project-v1",
      "timestamp": "2025-12-13T10:49:13Z",
      "path": "/home/user/.backup-manager/backups/my-project-v1",
      "filesCount": 245,
      "incremental": false
    }
  ]
}
```

**Backup Metadata** (`backups/[name]/metadata.json`):
```json
{
  "name": "my-project-v1",
  "timestamp": "2025-12-13T10:49:13Z",
  "sourcePath": "/home/user/projects/myapp",
  "fileCount": 245,
  "totalSize": 16043572,
  "incremental": false,
  "fileHashes": {
    "file1.js": "5d41402abc4b2a76b9719d911017c592",
    "dir/file2.txt": "098f6bcd4621d373cade4e832627b4f6"
  },
  "files": [
    {
      "original": "/home/user/projects/myapp/file1.js",
      "relative": "file1.js",
      "size": 1024,
      "hash": "5d41402abc4b2a76b9719d911017c592"
    }
  ]
}
```

## How Incremental Backups Work

1. **First Backup (Full)**
   - All files are backed up
   - MD5 hashes are calculated and stored
   - Metadata is created

2. **Subsequent Backups (Incremental)**
   - Previous backup metadata is loaded
   - New MD5 hashes are calculated
   - Only files with different hashes are backed up
   - Only changed files are stored, reducing space usage

3. **Restoration**
   - All files (full + incremental) are restored
   - Complete directory structure is recreated
   - No manual merging needed

## Error Handling

The backup manager handles various error scenarios:

- **Permission Denied**: Logs warning and continues with other files
- **File Not Found**: Gracefully skips missing files
- **Invalid Paths**: Validates paths before processing
- **Corrupted Metadata**: Falls back to full backup for incremental
- **Directory Conflicts**: Creates directories if they don't exist

## Performance Considerations

### Backup Speed
- File copying: Limited by disk I/O speed
- Hash calculation: ~1-5ms per file depending on size
- Typical backup: 1000 files in 5-10 seconds

### Storage Optimization
- Full backup: Uses 100% of original size
- Incremental backup: Uses ~10-30% of original size (varies by changes)
- No compression: Backups use raw file size

### Scalability
- Can handle thousands of files
- Tested with 5000+ files
- Memory usage: ~50MB for typical 10GB backup

## Supported Platforms

✅ **Windows** (7, 10, 11)
✅ **macOS** (10.15+)
✅ **Linux** (Debian/Ubuntu, CentOS, Fedora)

## Troubleshooting

### Backup fails with permission errors
- Run with elevated privileges
- Check directory permissions
- Ensure user has read access to source files

### Verification reports corrupted files
- Backup might be incomplete
- Files might have been modified
- Try creating a fresh backup

### Restoration has missing files
- Check if incremental backups were used
- Verify restore path has sufficient space
- Check file system permissions at destination

### Slow backup performance
- Check disk I/O performance
- Exclude temporary/cache directories from backup
- Use incremental backups for large projects

## Future Enhancements

- [ ] Compression support (ZIP, TAR.GZ)
- [ ] Encryption for sensitive backups
- [ ] Scheduled automatic backups
- [ ] Remote backup support (S3, cloud storage)
- [ ] Differential backups (only block-level changes)
- [ ] Parallel file processing for faster backups
- [ ] GUI interface
- [ ] Backup size statistics and trends
- [ ] Exclude patterns (gitignore-style)
- [ ] Deduplication for identical files

## License

MIT

## Author

SkandaBT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
