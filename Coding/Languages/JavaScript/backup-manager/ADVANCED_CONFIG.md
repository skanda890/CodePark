# Advanced Configuration Guide

Customize the Backup Manager for your specific needs.

## Table of Contents

1. [Changing Storage Location](#changing-storage-location)
2. [Modifying Backup Behavior](#modifying-backup-behavior)
3. [Adding Custom Functions](#adding-custom-functions)
4. [Performance Optimization](#performance-optimization)
5. [Integration Examples](#integration-examples)

## Changing Storage Location

### Default Location

By default, backups are stored in:
```
~/.backup-manager/
```

This expands to:
- **Windows**: `C:\Users\YourUsername\.backup-manager\`
- **macOS**: `/Users/YourUsername/.backup-manager/`
- **Linux**: `/home/username/.backup-manager/`

### Custom Location

#### Step 1: Edit index.js

Find line 8:
```javascript
const CONFIG_DIR = path.join(os.homedir(), '.backup-manager')
```

Change to:
```javascript
// Option A: Use environment variable
const CONFIG_DIR = process.env.BACKUP_DIR || path.join(os.homedir(), '.backup-manager')

// Option B: Use fixed path
const CONFIG_DIR = 'D:\\Backups\\BackupManager'  // Windows
const CONFIG_DIR = '/mnt/backup/backup-manager'   // Linux

// Option C: Use relative path
const CONFIG_DIR = path.join(process.cwd(), 'backups')
```

#### Step 2: Use Custom Location

**Option A - Environment Variable:**
```bash
# Windows
set BACKUP_DIR=D:\MyBackups
npm start

# macOS/Linux
export BACKUP_DIR=/mnt/external/backups
npm start
```

**Option B - Permanent in index.js:**
Edit the CONFIG_DIR line and save.

### Network Storage

#### Windows Network Drive

```javascript
const CONFIG_DIR = path.join('\\\\server\\share', 'BackupManager')
```

#### macOS Network

```javascript
const CONFIG_DIR = '/Volumes/NetworkDrive/BackupManager'
```

#### Linux NFS/Samba

```javascript
const CONFIG_DIR = '/mnt/network-storage/BackupManager'
```

**Note**: Mount network drives first before running the application.

## Modifying Backup Behavior

### Exclude Files/Directories

Add this function after `getAllFiles()` (around line 70):

```javascript
// Filter files based on patterns
function filterFiles(files, excludePatterns = []) {
  // Default exclude patterns
  const patterns = [
    /node_modules/,
    /\.git/,
    /\.vscode/,
    /dist/,
    /build/,
    /.*\.tmp$/,
    /.*\.log$/,
    ...excludePatterns
  ]
  
  return files.filter(file => {
    return !patterns.some(pattern => pattern.test(file))
  })
}
```

Modify `createBackup()` to use it:

```javascript
let allFiles = getAllFiles(response.sourcePath)

// Add this line after getAllFiles()
allFiles = filterFiles(allFiles)
```

### Custom File Size Limits

Skip large files during backup:

```javascript
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

// In createBackup(), modify the file copy loop:
for (const file of allFiles) {
  const fileSize = fs.statSync(file).size
  if (fileSize > MAX_FILE_SIZE) {
    console.warn(`Skipping large file: ${file} (${(fileSize/1024/1024).toFixed(2)}MB)`)
    continue
  }
  // ... rest of backup code
}
```

### Auto-Delete Old Backups

Add this function:

```javascript
function deleteOldBackups(daysToKeep = 30) {
  const metadata = loadMetadata()
  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  const cutoffTime = now - (daysToKeep * msPerDay)
  
  let deletedCount = 0
  
  metadata.backups = metadata.backups.filter(backup => {
    const backupTime = new Date(backup.timestamp).getTime()
    if (backupTime < cutoffTime) {
      try {
        fs.rmSync(backup.path, { recursive: true, force: true })
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete ${backup.name}:`, error)
      }
      return false  // Remove from metadata
    }
    return true
  })
  
  saveMetadata(metadata)
  console.log(`Deleted ${deletedCount} old backups`)
}
```

Add to main menu:

```javascript
// In main menu choices array
{
  title: 'Auto-Delete Old Backups',
  value: 'auto-delete'
}

// In switch statement
case 'auto-delete':
  deleteOldBackups(30)  // Keep 30 days
  break
```

## Adding Custom Functions

### Backup Size Report

```javascript
function getBackupSize() {
  try {
    console.log('\n--- Backup Size Report ---')
    const metadata = loadMetadata()
    const backupsPath = path.join(CONFIG_DIR, 'backups')
    
    let totalSize = 0
    
    metadata.backups.forEach(backup => {
      const backupPath = backup.path
      const size = getDirectorySize(backupPath)
      totalSize += size
      
      const sizeGB = size / 1024 / 1024 / 1024
      console.log(`\n${backup.name}`)
      console.log(`  Size: ${sizeGB.toFixed(2)} GB`)
      console.log(`  Files: ${backup.filesCount}`)
    })
    
    console.log(`\nTotal Storage: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`)
  } catch (error) {
    console.error('Error getting backup sizes:', error)
  }
}

function getDirectorySize(dirPath) {
  let size = 0
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
    files.forEach(file => {
      const filePath = path.join(dirPath, file.name)
      if (file.isDirectory()) {
        size += getDirectorySize(filePath)
      } else {
        size += fs.statSync(filePath).size
      }
    })
  } catch (error) {
    console.warn(`Error reading directory ${dirPath}:`, error.message)
  }
  return size
}
```

### Backup Comparison

```javascript
function compareBackups() {
  try {
    console.log('\n--- Compare Two Backups ---')
    const metadata = loadMetadata()
    
    if (metadata.backups.length < 2) {
      console.log('Need at least 2 backups to compare')
      return
    }
    
    // Selection logic here
    // Compare file counts, sizes, dates
  } catch (error) {
    console.error('Error comparing backups:', error)
  }
}
```

## Performance Optimization

### Increase Hash Algorithm Speed

For very large files, use SHA1 instead of MD5 (faster but less secure):

```javascript
// Change line with createHash
// FROM:
return crypto.createHash('md5').update(content).digest('hex')

// TO:
return crypto.createHash('sha1').update(content).digest('hex')
```

### Batch Processing

Process files in batches for better performance:

```javascript
const BATCH_SIZE = 100

async function backupFilesInBatches(files, destPath) {
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(file => copyFileAsync(file, destPath)))
    console.log(`Processed ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files`)
  }
}

async function copyFileAsync(srcFile, destPath) {
  return new Promise((resolve, reject) => {
    const destFile = path.join(destPath, path.relative(srcPath, srcFile))
    const dir = path.dirname(destFile)
    
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) reject(err)
      fs.copyFile(srcFile, destFile, (err) => {
        if (err) reject(err)
        resolve()
      })
    })
  })
}
```

### Limit Memory Usage

For very large backups, process metadata in streams:

```javascript
const MAX_FILES_IN_MEMORY = 1000

function chunkFileList(files) {
  const chunks = []
  for (let i = 0; i < files.length; i += MAX_FILES_IN_MEMORY) {
    chunks.push(files.slice(i, i + MAX_FILES_IN_MEMORY))
  }
  return chunks
}
```

## Integration Examples

### Schedule Backups (Node Schedule)

```bash
npm install node-schedule
```

```javascript
const schedule = require('node-schedule')

// Run backup daily at 2 AM
function scheduleBackup() {
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('Running scheduled backup...')
    // Call backup function
    await createBackup()
  })
}
```

### Email Notifications

```bash
npm install nodemailer
```

```javascript
const nodemailer = require('nodemailer')

async function sendBackupNotification(backupName, status) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'recipient@example.com',
    subject: `Backup ${backupName} - ${status}`,
    text: `Backup ${backupName} completed with status: ${status}`
  })
}
```

### Slack Integration

```bash
npm install @slack/web-api
```

```javascript
const { WebClient } = require('@slack/web-api')

const slack = new WebClient(process.env.SLACK_TOKEN)

async function notifySlack(message) {
  try {
    await slack.chat.postMessage({
      channel: '#backups',
      text: message
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}
```

### Cloud Upload (AWS S3)

```bash
npm install aws-sdk
```

```javascript
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

async function uploadToS3(localPath, bucketName, backupName) {
  const fileContent = fs.readFileSync(localPath)
  
  const params = {
    Bucket: bucketName,
    Key: `backups/${backupName}.zip`,
    Body: fileContent
  }
  
  try {
    const result = await s3.upload(params).promise()
    console.log(`Uploaded to S3: ${result.Location}`)
  } catch (error) {
    console.error('S3 upload failed:', error)
  }
}
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Storage configuration
BACKUP_DIR=/custom/backup/path

# Limits
MAX_FILE_SIZE=104857600
MAX_BACKUP_AGE_DAYS=30
BATCH_SIZE=100

# Notifications
SLACK_TOKEN=xoxb-...
EMAIL_USER=backup@example.com
EMAIL_PASS=app-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=my-backups
```

Load with `dotenv`:

```bash
npm install dotenv
```

```javascript
require('dotenv').config()

const CONFIG_DIR = process.env.BACKUP_DIR || path.join(os.homedir(), '.backup-manager')
```

## Debugging & Logging

### Enable Verbose Logging

Add to top of index.js:

```javascript
const DEBUG = process.env.DEBUG === 'true'

function debug(message) {
  if (DEBUG) console.log(`[DEBUG] ${message}`)
}
```

Run with:
```bash
DEBUG=true npm start
```

### File Operations Logging

```javascript
function logFileOperation(operation, file, status) {
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp} | ${operation} | ${file} | ${status}
`
  
  const logFile = path.join(CONFIG_DIR, 'operations.log')
  fs.appendFileSync(logFile, logMessage)
}
```

## Best Practices

1. **Test changes** in a safe environment first
2. **Backup your config** before making changes
3. **Use version control** for modified index.js
4. **Monitor disk space** regularly
5. **Document custom functions** with comments
6. **Use environment variables** for sensitive data
7. **Test recovery** after major changes
8. **Keep logs** for audit trails

---

**Happy customizing!** For questions, check `README.md` and `CHANGELOG.md`.
