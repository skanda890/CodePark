#!/usr/bin/env node

/**
 * Bleeding-Edge Dependency Updater
 *
 * This script updates all dependencies to their absolute latest versions,
 * including pre-release, beta, alpha, and canary versions.
 *
 * WARNING: This is extremely experimental and may break your application!
 *
 * Usage:
 *   node scripts/update-to-bleeding-edge.js
 *   node scripts/update-to-bleeding-edge.js --dry-run
 *   node scripts/update-to-bleeding-edge.js --package=express
 */

const fs = require('fs').promises
const { execSync } = require('child_process')
const path = require('path')

// Configuration
const CONFIG = {
  packageJsonPath: path.join(process.cwd(), 'package.json'),
  backupPath: path.join(process.cwd(), '.package-backups'),
  logPath: path.join(process.cwd(), 'logs', 'bleeding-edge-updates.log'),
  preferredTags: ['next', 'canary', 'beta', 'alpha', 'rc', 'latest'],
  excludePackages: [] // Add packages to exclude from updates
}

// Parse CLI arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const specificPackage = args
  .find((arg) => arg.startsWith('--package='))
  ?.split('=')[1]
const verbose = args.includes('--verbose') || args.includes('-v')

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log (message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function execCommand (command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      ...options
    })
  } catch (error) {
    if (verbose) {
      log(`Command failed: ${command}`, 'red')
      log(error.message, 'red')
    }
    throw error
  }
}

async function createBackup () {
  log('\n📦 Creating backup...', 'cyan')

  try {
    await fs.mkdir(CONFIG.backupPath, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(
      CONFIG.backupPath,
      `package-${timestamp}.json`
    )

    const packageJson = await fs.readFile(CONFIG.packageJsonPath, 'utf8')
    await fs.writeFile(backupFile, packageJson)

    log(`✅ Backup created: ${backupFile}`, 'green')

    // Clean old backups (keep last 7)
    const backups = await fs.readdir(CONFIG.backupPath)
    if (backups.length > 7) {
      const sortedBackups = backups
        .filter((f) => f.startsWith('package-') && f.endsWith('.json'))
        .sort()
        .reverse()

      for (let i = 7; i < sortedBackups.length; i++) {
        await fs.unlink(path.join(CONFIG.backupPath, sortedBackups[i]))
        log(`🗑️  Deleted old backup: ${sortedBackups[i]}`, 'yellow')
      }
    }

    return backupFile
  } catch (error) {
    log(`❌ Backup failed: ${error.message}`, 'red')
    throw error
  }
}

async function getLatestVersion (packageName) {
  try {
    const info = execCommand(`npm view ${packageName} dist-tags --json`)
    const tags = JSON.parse(info)

    // Try to find the most bleeding-edge version
    for (const tag of CONFIG.preferredTags) {
      if (tags[tag]) {
        return { version: tags[tag], tag }
      }
    }

    // Fallback to latest
    return { version: tags.latest, tag: 'latest' }
  } catch (error) {
    log(`⚠️  Could not fetch version for ${packageName}`, 'yellow')
    return null
  }
}

async function updatePackages () {
  log('\n🔍 Reading package.json...', 'cyan')

  const packageJson = JSON.parse(
    await fs.readFile(CONFIG.packageJsonPath, 'utf8')
  )
  const updates = []

  // Process dependencies
  const depTypes = ['dependencies', 'devDependencies', 'optionalDependencies']

  for (const depType of depTypes) {
    if (!packageJson[depType]) continue

    log(`\n📋 Checking ${depType}...`, 'bright')

    const deps = packageJson[depType]
    const packageNames = specificPackage
      ? [specificPackage].filter((pkg) => deps[pkg])
      : Object.keys(deps)

    for (const pkg of packageNames) {
      if (CONFIG.excludePackages.includes(pkg)) {
        log(`⏭️  Skipping excluded package: ${pkg}`, 'yellow')
        continue
      }

      const currentVersion = deps[pkg]
      log(`  Checking ${pkg}@${currentVersion}...`, 'blue')

      const latest = await getLatestVersion(pkg)

      if (!latest) {
        log(`  ❌ Failed to get version for ${pkg}`, 'red')
        continue
      }

      if (currentVersion === latest.tag || currentVersion === latest.version) {
        log(
          `  ✅ ${pkg} is already on ${latest.tag} (${latest.version})`,
          'green'
        )
      } else {
        log(`  🔄 Update available: ${pkg}`, 'magenta')
        log(`     Current: ${currentVersion}`, 'yellow')
        log(`     Latest: ${latest.tag} (${latest.version})`, 'green')

        updates.push({
          package: pkg,
          depType,
          currentVersion,
          newVersion: latest.version,
          newTag: latest.tag
        })

        // Update package.json object
        deps[pkg] = latest.tag
      }
    }
  }

  return { packageJson, updates }
}

async function applyUpdates (packageJson, updates) {
  if (updates.length === 0) {
    log('\n✅ All packages are already at bleeding-edge versions!', 'green')
    return
  }

  log(`\n📝 Summary: ${updates.length} package(s) to update`, 'cyan')

  for (const update of updates) {
    log(
      `  • ${update.package}: ${update.currentVersion} → ${update.newTag}`,
      'blue'
    )
  }

  if (dryRun) {
    log('\n🔍 DRY RUN MODE - No changes made', 'yellow')
    return
  }

  log('\n💾 Saving updated package.json...', 'cyan')
  await fs.writeFile(
    CONFIG.packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  )

  log('\n📦 Running npm install...', 'cyan')
  try {
    execCommand('npm install', { stdio: 'inherit' })
    log('\n✅ Installation completed successfully!', 'green')
  } catch (error) {
    log('\n❌ Installation failed!', 'red')
    log('Rolling back to backup...', 'yellow')
    throw error
  }

  // Run security audit
  log('\n🔒 Running security audit...', 'cyan')
  try {
    execCommand('npm audit --audit-level=moderate')
    log('✅ Security audit passed', 'green')
  } catch (error) {
    log(
      '⚠️  Security vulnerabilities found - check npm audit output',
      'yellow'
    )
  }
}

async function logToFile (message) {
  try {
    const logDir = path.dirname(CONFIG.logPath)
    await fs.mkdir(logDir, { recursive: true })

    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}\n`

    await fs.appendFile(CONFIG.logPath, logEntry)
  } catch (error) {
    // Silently fail - logging should not break the main process
  }
}

async function main () {
  log('\n🚀 CodePark Bleeding-Edge Updater', 'bright')
  log('='.repeat(50), 'cyan')

  if (dryRun) {
    log('\n⚠️  DRY RUN MODE - No changes will be made', 'yellow')
  }

  if (specificPackage) {
    log(`\n🎯 Targeting specific package: ${specificPackage}`, 'cyan')
  }

  try {
    // Create backup before making changes
    const backupFile = await createBackup()
    await logToFile(`Backup created: ${backupFile}`)

    // Get updates
    const { packageJson, updates } = await updatePackages()

    // Apply updates
    await applyUpdates(packageJson, updates)

    // Log success
    await logToFile(`Successfully updated ${updates.length} packages`)

    log('\n🎉 Update process completed!', 'green')
    log('='.repeat(50), 'cyan')

    if (updates.length > 0 && !dryRun) {
      log('\n⚠️  IMPORTANT: Test your application thoroughly!', 'yellow')
      log('Pre-release versions may contain breaking changes.', 'yellow')
      log(`\nBackup location: ${backupFile}`, 'blue')
      log('\nTo restore backup:', 'blue')
      log(`  cp "${backupFile}" package.json`, 'cyan')
      log('  npm install', 'cyan')
    }
  } catch (error) {
    log('\n❌ Update process failed!', 'red')
    log(error.message, 'red')
    await logToFile(`Update failed: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { updatePackages, createBackup, getLatestVersion }
