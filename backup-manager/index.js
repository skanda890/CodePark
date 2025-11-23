const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec } = require('child_process')
const util = require('util')
const prompts = require('prompts')

const execPromise = util.promisify(exec)

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
          console.warn(
            'Could not retrieve installed apps using dpkg. Trying with ls.'
          )
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
      commands.push(
        '# Windows: Manual Installation Recommended. Use Chocolatey or winget for better automation.'
      )
      appList.forEach((app) => {
        commands.push(
          `# Install ${app} manually or using: choco install ${app} or winget install ${app}`
        )
      })
      break
    case 'darwin':
      commands.push('# macOS: Use Homebrew if available.')
      appList.forEach((app) => {
        const brewCaskName = app.toLowerCase().replace(/\s+/g, '-')
        commands.push(
          `brew install --cask ${brewCaskName} || brew install ${brewCaskName}`
        )
      })
      break
    case 'linux':
      commands.push('# Linux (Debian/Ubuntu): Use apt.')
      appList.forEach((app) => {
        commands.push(`sudo apt-get install -y ${app}`)
      })
      break
    default:
      commands.push(
        '# Unsupported operating system for automated installation.'
      )
      break
  }

  return commands
}

async function saveAppListToFile (appList, commands) {
  try {
    const osType = process.platform // Get OS type here
    const defaultFileName = 'installed_apps_and_commands'
    let fileExtension = '.txt'

    if (osType === 'win32') {
      fileExtension = '.bat' // Use .bat for Windows batch files
    } else if (osType === 'darwin' || osType === 'linux') {
      fileExtension = '.sh' // Use .sh for macOS/Linux shell scripts
    }

    const response = await prompts({
      type: 'text',
      name: 'filePath',
      message: 'Enter the path to save the app list and commands:',
      initial: path.join(os.homedir(), defaultFileName + fileExtension),
      validate: (input) => {
        if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
          return 'Please enter a file path, not a directory.'
        }
        return true
      }
    })

    if (!response || !response.filePath) {
      console.log('Save cancelled')
      return
    }

    const fileContent = `Installed Applications:\n${appList.join('\n')}\n\n# Installation Commands:\n${commands.join('\n')}`

    fs.writeFileSync(response.filePath, fileContent)
    console.log(`App list and commands saved to: ${response.filePath}`)
  } catch (error) {
    console.error('Error saving app list:', error)
  }
}

async function main () {
  try {
    const installedApps = await getInstalledApps()
    if (installedApps.length > 0) {
      const installCommands = generateInstallCommands(installedApps)
      await saveAppListToFile(installedApps, installCommands)
    } else {
      console.log('No installed apps found or an error occurred.')
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

main()
