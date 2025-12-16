const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')
const util = require('util')
const prompts = require('prompts')
const crypto = require('crypto')

const execPromise = util.promisify(exec)

// Configuration
const CONFIG_DIR = path.join(os.homedir(), '.backup-manager')
const METADATA_FILE = path.join(CONFIG_DIR, 'backups.json')

// Initialize config directory
function initializeConfig () {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify({ backups: [] }, null, 2))
  }
}

// Load backup metadata
function loadMetadata () {
  try {
    const data = fs.readFileSync(METADATA_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading metadata:', error)
    return { backups: [] }
  }
}

// Save backup metadata
function saveMetadata (metadata) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))
  } catch (error) {
    console.error('Error saving metadata:', error)
  }
}

// Calculate file hash for incremental backups
function calculateFileHash (filePath) {
  try {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('md5').update(content).digest('hex')
  } catch (error) {
    return null
  }
}

// Get all files recursively
function getAllFiles (dirPath, arrayOfFiles = []) {
  try {
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
      const filePath = path.join(dirPath, file)
      try {
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
        } else {
          arrayOfFiles.push(filePath)
        }
      } catch (error) {
        console.warn(`Skipping ${filePath}: ${error.message}`)
      }
    })
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }

  return arrayOfFiles
}

// Create a backup
async function createBackup () {
  try {
    console.log('\n--- Create New Backup ---')

    const response = await prompts([
      {
        type: 'text',
        name: 'backupName',
        message: 'Enter backup name:',
        validate: (input) =>
          input.trim().length > 0 ? true : 'Name cannot be empty'
      },
      {
        type: 'text',
        name: 'sourcePath',
        message: 'Enter source path to backup:',
        initial: process.cwd(),
        validate: (input) =>
          fs.existsSync(input) ? true : 'Path does not exist'
      },
      {
        type: 'confirm',
        name: 'useCompression',
        message: 'Use compression (requires tar/7z)?',
        initial: true
      },
      {
        type: 'confirm',
        name: 'incremental',
        message: 'Perform incremental backup (skip unchanged files)?',
        initial: false
      }
    ])

    if (!response.backupName) return

    const backupDir = path.join(CONFIG_DIR, 'backups', response.backupName)
    const metadataPath = path.join(backupDir, 'metadata.json')

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    let filesBackedUp = 0
    const fileList = []
    const fileHashes = {}

    const allFiles = getAllFiles(response.sourcePath)

    // Load previous metadata for incremental backup
    let previousMetadata = {}
    if (response.incremental && fs.existsSync(metadataPath)) {
      try {
        previousMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      } catch (e) {
        console.warn(
          'Could not load previous metadata, performing full backup'
        )
      }
    }

    console.log(`\nBacking up ${allFiles.length} files...`)

    // Backup files
    for (const file of allFiles) {
      try {
        const relativePath = path.relative(response.sourcePath, file)
        const currentHash = calculateFileHash(file)
        const previousHash = previousMetadata.fileHashes?.[relativePath]

        // Skip if incremental and file unchanged
        if (response.incremental && currentHash === previousHash) {
          continue
        }

        const destPath = path.join(backupDir, 'files', relativePath)
        const destDir = path.dirname(destPath)

        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }

        fs.copyFileSync(file, destPath)
        fileHashes[relativePath] = currentHash
        fileList.push({
          original: file,
          relative: relativePath,
          size: fs.statSync(file).size,
          hash: currentHash
        })
        filesBackedUp++
      } catch (error) {
        console.warn(`Failed to backup ${file}: ${error.message}`)
      }
    }

    // Save metadata
    const backupMetadata = {
      name: response.backupName,
      timestamp: new Date().toISOString(),
      sourcePath: response.sourcePath,
      fileCount: filesBackedUp,
      totalSize: fileList.reduce((sum, f) => sum + f.size, 0),
      fileHashes,
      files: fileList,
      incremental: response.incremental
    }

    fs.writeFileSync(metadataPath, JSON.stringify(backupMetadata, null, 2))

    // Update global metadata
    const globalMetadata = loadMetadata()
    globalMetadata.backups.push({
      name: response.backupName,
      timestamp: backupMetadata.timestamp,
      path: backupDir,
      filesCount: filesBackedUp,
      incremental: response.incremental
    })
    saveMetadata(globalMetadata)

    console.log('\n✓ Backup created successfully!')
    console.log(`  Location: ${backupDir}`)
    console.log(`  Files backed up: ${filesBackedUp}`)
    console.log(
      `  Total size: ${(backupMetadata.totalSize / 1024 / 1024).toFixed(2)} MB`
    )
  } catch (error) {
    console.error('Error creating backup:', error)
  }
}

// Restore from backup
async function restoreBackup () {
  try {
    console.log('\n--- Restore Backup ---')

    const metadata = loadMetadata()

    if (metadata.backups.length === 0) {
      console.log('No backups found.')
      return
    }

    const backupChoices = metadata.backups.map((b, i) => ({
      title: `${b.name} (${b.filesCount} files) - ${new Date(b.timestamp).toLocaleString()}`,
      value: i
    }))

    const { backupIndex } = await prompts({
      type: 'select',
      name: 'backupIndex',
      message: 'Select backup to restore:',
      choices: backupChoices
    })

    if (backupIndex === undefined) return

    const backup = metadata.backups[backupIndex]
    const backupDir = backup.path
    const filesDir = path.join(backupDir, 'files')

    if (!fs.existsSync(filesDir)) {
      console.log('Backup files not found.')
      return
    }

    const { restorePath } = await prompts({
      type: 'text',
      name: 'restorePath',
      message: 'Enter restoration path:',
      initial: process.cwd()
    })

    if (!restorePath) return

    // Create restore directory
    if (!fs.existsSync(restorePath)) {
      fs.mkdirSync(restorePath, { recursive: true })
    }

    const allFiles = getAllFiles(filesDir)
    let filesRestored = 0

    console.log(`\nRestoring ${allFiles.length} files...`)

    for (const file of allFiles) {
      try {
        const relativePath = path.relative(filesDir, file)
        const destPath = path.join(restorePath, relativePath)
        const destDir = path.dirname(destPath)

        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }

        fs.copyFileSync(file, destPath)
        filesRestored++
      } catch (error) {
        console.warn(`Failed to restore ${file}: ${error.message}`)
      }
    }

    console.log('\n✓ Restoration completed!')
    console.log(`  Location: ${restorePath}`)
    console.log(`  Files restored: ${filesRestored}`)
  } catch (error) {
    console.error('Error restoring backup:', error)
  }
}

// List all backups
async function listBackups () {
  try {
    console.log('\n--- Backup History ---')

    const metadata = loadMetadata()

    if (metadata.backups.length === 0) {
      console.log('No backups found.')
      return
    }

    console.log(`\nTotal backups: ${metadata.backups.length}\n`)

    metadata.backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp)
      const type = backup.incremental ? '[INC]' : '[FULL]'
      console.log(`${index + 1}. ${backup.name} ${type}`)
      console.log(`   Created: ${date.toLocaleString()}`)
      console.log(`   Files: ${backup.filesCount}`)
      console.log(`   Path: ${backup.path}`)
      console.log()
    })
  } catch (error) {
    console.error('Error listing backups:', error)
  }
}

// Verify backup integrity
async function verifyBackup () {
  try {
    console.log('\n--- Verify Backup ---')

    const metadata = loadMetadata()

    if (metadata.backups.length === 0) {
      console.log('No backups found.')
      return
    }

    const backupChoices = metadata.backups.map((b, i) => ({
      title: `${b.name} - ${new Date(b.timestamp).toLocaleString()}`,
      value: i
    }))

    const { backupIndex } = await prompts({
      type: 'select',
      name: 'backupIndex',
      message: 'Select backup to verify:',
      choices: backupChoices
    })

    if (backupIndex === undefined) return

    const backup = metadata.backups[backupIndex]
    const metadataPath = path.join(backup.path, 'metadata.json')
    const backupMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))

    console.log(`\nVerifying backup: ${backup.name}`)

    let validFiles = 0
    const corruptedFiles = []

    for (const fileInfo of backupMetadata.files) {
      const filePath = path.join(backup.path, 'files', fileInfo.relative)

      if (!fs.existsSync(filePath)) {
        corruptedFiles.push(`Missing: ${fileInfo.relative}`)
        continue
      }

      const currentHash = calculateFileHash(filePath)
      if (currentHash === fileInfo.hash) {
        validFiles++
      } else {
        corruptedFiles.push(`Corrupted: ${fileInfo.relative}`)
      }
    }

    console.log('\n✓ Verification complete!')
    console.log(`  Valid files: ${validFiles}`)
    console.log(`  Total files: ${backupMetadata.fileCount}`)

    if (corruptedFiles.length > 0) {
      console.log('\n⚠ Issues found:')
      corruptedFiles.forEach((issue) => console.log(`  - ${issue}`))
    } else {
      console.log('\n✓ All files verified successfully!')
    }
  } catch (error) {
    console.error('Error verifying backup:', error)
  }
}

// Delete backup
async function deleteBackup () {
  try {
    console.log('\n--- Delete Backup ---')

    const metadata = loadMetadata()

    if (metadata.backups.length === 0) {
      console.log('No backups found.')
      return
    }

    const backupChoices = metadata.backups.map((b, i) => ({
      title: `${b.name} - ${new Date(b.timestamp).toLocaleString()}`,
      value: i
    }))

    const { backupIndex } = await prompts({
      type: 'select',
      name: 'backupIndex',
      message: 'Select backup to delete:',
      choices: backupChoices
    })

    if (backupIndex === undefined) return

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure? This action cannot be undone.',
      initial: false
    })

    if (!confirm) return

    const backup = metadata.backups[backupIndex]

    // Remove backup directory
    fs.rmSync(backup.path, { recursive: true, force: true })

    // Update metadata
    metadata.backups.splice(backupIndex, 1)
    saveMetadata(metadata)

    console.log('\n✓ Backup deleted successfully!')
  } catch (error) {
    console.error('Error deleting backup:', error)
  }
}

// App management functions (legacy)
async function getInstalledApps () {
  try {
    let apps = []
    switch (process.platform) {
      case 'win32':
        const powershellCommand =
          'Get-WmiObject -Class Win32_Product | Select-Object -ExpandProperty Name'
        const { stdout: winApps } = await execPromise(
          `powershell.exe -Command "${powershellCommand}"`
        )
        apps = winApps.trim().split('\r\n')
        break
      case 'darwin':
        const { stdout: macApps } = await execPromise(
          "mdfind \"kMDItemKind == 'Application'\""
        )
        apps = macApps
          .trim()
          .split('\n')
          .map((appPath) => path.basename(appPath))
        break
      case 'linux':
        try {
          const { stdout: linuxApps } = await execPromise(
            'dpkg --get-selections | grep -v deinstall'
          )
          apps = linuxApps
            .trim()
            .split('\n')
            .map((line) => line.split('\t')[0])
        } catch (error) {
          const { stdout: linuxApps } = await execPromise(
            'ls /usr/share/applications/'
          )
          apps = linuxApps.trim().split('\n')
        }
        break
      default:
        console.log('Unsupported operating system for app listing.')
        return []
    }
    return apps
  } catch (error) {
    console.error('Error getting installed apps:', error)
    return []
  }
}

function generateInstallCommands (appList) {
  const osType = process.platform
  const commands = []

  switch (osType) {
    case 'win32':
      commands.push('# Windows: Manual Installation Recommended.')
      appList.forEach((app) => {
        commands.push(`# choco install ${app} or winget install ${app}`)
      })
      break
    case 'darwin':
      commands.push('# macOS: Use Homebrew')
      appList.forEach((app) => {
        const brewCaskName = app.toLowerCase().replace(/\s+/g, '-')
        commands.push(`brew install --cask ${brewCaskName}`)
      })
      break
    case 'linux':
      commands.push('# Linux (Debian/Ubuntu)')
      appList.forEach((app) => {
        commands.push(`sudo apt-get install -y ${app}`)
      })
      break
    default:
      commands.push('# Unsupported operating system')
      break
  }

  return commands
}

async function saveAppListToFile (appList, commands) {
  try {
    const osType = process.platform
    const defaultFileName = 'installed_apps_and_commands'
    let fileExtension = '.txt'

    if (osType === 'win32') {
      fileExtension = '.bat'
    } else if (osType === 'darwin' || osType === 'linux') {
      fileExtension = '.sh'
    }

    const response = await prompts({
      type: 'text',
      name: 'filePath',
      message: 'Enter the path to save the app list:',
      initial: path.join(os.homedir(), defaultFileName + fileExtension),
      validate: (input) => {
        if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
          return 'Please enter a file path, not a directory.'
        }
        return true
      }
    })

    if (!response.filePath) {
      console.log('Save cancelled')
      return
    }

    const fileContent = `Installed Applications:\n${appList.join('\n')}\n\nInstallation Commands:\n${commands.join('\n')}`
    fs.writeFileSync(response.filePath, fileContent)
    console.log(`Saved to: ${response.filePath}`)
  } catch (error) {
    console.error('Error saving app list:', error)
  }
}

// Main menu
async function main () {
  try {
    initializeConfig()

    let running = true

    while (running) {
      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'Backup Manager - What would you like to do?',
        choices: [
          { title: 'Create Backup', value: 'create' },
          { title: 'Restore Backup', value: 'restore' },
          { title: 'List Backups', value: 'list' },
          { title: 'Verify Backup', value: 'verify' },
          { title: 'Delete Backup', value: 'delete' },
          { title: 'Export Installed Apps', value: 'apps' },
          { title: 'Exit', value: 'exit' }
        ]
      })

      switch (action) {
        case 'create':
          await createBackup()
          break
        case 'restore':
          await restoreBackup()
          break
        case 'list':
          await listBackups()
          break
        case 'verify':
          await verifyBackup()
          break
        case 'delete':
          await deleteBackup()
          break
        case 'apps':
          const installedApps = await getInstalledApps()
          if (installedApps.length > 0) {
            const installCommands = generateInstallCommands(installedApps)
            await saveAppListToFile(installedApps, installCommands)
          } else {
            console.log('No installed apps found.')
          }
          break
        case 'exit':
          running = false
          console.log('Goodbye!')
          break
      }
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

main()
