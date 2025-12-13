const si = require('systeminformation')
const fs = require('fs')
const path = require('path')

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
}

// Helper function to format output
function formatHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(50)}`)
  console.log(`${title.toUpperCase()}`)
  console.log(`${'='.repeat(50)}${colors.reset}\n`)
}

function formatSection(title) {
  console.log(`${colors.bright}${colors.green}${title}${colors.reset}`)
}

function formatKeyValue(key, value) {
  console.log(`  ${key}: ${value}`)
}

// Fetch BIOS Information
async function getBiosInfo() {
  try {
    const bios = await si.bios()
    formatHeader('BIOS Information')
    formatKeyValue('Manufacturer', bios.manufacturer)
    formatKeyValue('Version', bios.version)
    formatKeyValue('Release Date', bios.releaseDate)
    formatKeyValue('Revision', bios.revision)
    return bios
  } catch (error) {
    console.error(`${colors.red}Error fetching BIOS info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch System Information
async function getSystemInfo() {
  try {
    const system = await si.system()
    formatHeader('System Information')
    formatKeyValue('Manufacturer', system.manufacturer)
    formatKeyValue('Model', system.model)
    formatKeyValue('Type', system.type)
    formatKeyValue('UUID', system.uuid)
    return system
  } catch (error) {
    console.error(`${colors.red}Error fetching system info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch CPU Information
async function getCpuInfo() {
  try {
    const cpu = await si.cpu()
    formatHeader('CPU Information')
    formatKeyValue('Manufacturer', cpu.manufacturer)
    formatKeyValue('Brand', cpu.brand)
    formatKeyValue('Speed', `${cpu.speed} GHz`)
    formatKeyValue('Cores', cpu.cores)
    formatKeyValue('Physical Cores', cpu.physicalCores)
    formatKeyValue('Processors', cpu.processors)
    formatKeyValue('Cache', cpu.cache)
    return cpu
  } catch (error) {
    console.error(`${colors.red}Error fetching CPU info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch Memory Information
async function getMemoryInfo() {
  try {
    const mem = await si.mem()
    formatHeader('Memory Information')
    formatKeyValue('Total RAM', `${(mem.total / (1024 ** 3)).toFixed(2)} GB`)
    formatKeyValue('Available RAM', `${(mem.available / (1024 ** 3)).toFixed(2)} GB`)
    formatKeyValue('Used RAM', `${(mem.used / (1024 ** 3)).toFixed(2)} GB`)
    formatKeyValue('Usage Percentage', `${((mem.used / mem.total) * 100).toFixed(2)}%`)
    return mem
  } catch (error) {
    console.error(`${colors.red}Error fetching memory info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch OS Information
async function getOsInfo() {
  try {
    const os = await si.osInfo()
    formatHeader('Operating System Information')
    formatKeyValue('Platform', os.platform)
    formatKeyValue('Distro', os.distro)
    formatKeyValue('Release', os.release)
    formatKeyValue('Kernel', os.kernel)
    formatKeyValue('Arch', os.arch)
    formatKeyValue('Hostname', os.hostname)
    return os
  } catch (error) {
    console.error(`${colors.red}Error fetching OS info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch GPU Information
async function getGpuInfo() {
  try {
    const gpu = await si.graphics()
    formatHeader('GPU Information')
    if (gpu.controllers && gpu.controllers.length > 0) {
      gpu.controllers.forEach((controller, index) => {
        console.log(`${colors.bright}${colors.green}GPU ${index + 1}${colors.reset}`)
        formatKeyValue('Model', controller.model)
        formatKeyValue('Vendor', controller.vendor)
        formatKeyValue('Memory (MB)', controller.memory)
        console.log('')
      })
    } else {
      console.log('No GPU information available')
    }
    return gpu
  } catch (error) {
    console.error(`${colors.red}Error fetching GPU info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch Network Information
async function getNetworkInfo() {
  try {
    const network = await si.networkInterfaces()
    formatHeader('Network Information')
    network.forEach((iface, index) => {
      console.log(`${colors.bright}${colors.green}Interface ${index + 1}: ${iface.ifaceName}${colors.reset}`)
      formatKeyValue('Type', iface.type)
      formatKeyValue('IP4 Address', iface.ip4)
      formatKeyValue('IP6 Address', iface.ip6)
      formatKeyValue('MAC Address', iface.mac)
      formatKeyValue('Speed', iface.speed)
      console.log('')
    })
    return network
  } catch (error) {
    console.error(`${colors.red}Error fetching network info: ${error.message}${colors.reset}`)
    return null
  }
}

// Fetch all system information
async function getAllInfo() {
  try {
    const allData = {
      bios: await getBiosInfo(),
      system: await getSystemInfo(),
      cpu: await getCpuInfo(),
      memory: await getMemoryInfo(),
      os: await getOsInfo(),
      gpu: await getGpuInfo(),
      network: await getNetworkInfo(),
      timestamp: new Date().toISOString()
    }
    return allData
  } catch (error) {
    console.error(`${colors.red}Error fetching all info: ${error.message}${colors.reset}`)
    return null
  }
}

// Export data to JSON file
async function exportToJson(data, filename = 'system-info.json') {
  try {
    const filepath = path.join(__dirname, filename)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
    console.log(`${colors.green}✓ Data exported to ${filename}${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}Error exporting to JSON: ${error.message}${colors.reset}`)
  }
}

// Display help information
function showHelp() {
  formatHeader('Usage Instructions')
  console.log('Supported commands:')
  console.log('  node server.js              - Show all system information')
  console.log('  node server.js bios         - Show BIOS information only')
  console.log('  node server.js system       - Show system information only')
  console.log('  node server.js cpu          - Show CPU information only')
  console.log('  node server.js memory       - Show memory information only')
  console.log('  node server.js os           - Show OS information only')
  console.log('  node server.js gpu          - Show GPU information only')
  console.log('  node server.js network      - Show network information only')
  console.log('  node server.js export       - Export all info to JSON file')
  console.log('  node server.js help         - Show this help message\n')
}

// Main function
async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'bios':
      await getBiosInfo()
      break
    case 'system':
      await getSystemInfo()
      break
    case 'cpu':
      await getCpuInfo()
      break
    case 'memory':
      await getMemoryInfo()
      break
    case 'os':
      await getOsInfo()
      break
    case 'gpu':
      await getGpuInfo()
      break
    case 'network':
      await getNetworkInfo()
      break
    case 'export':
      const allData = await getAllInfo()
      await exportToJson(allData)
      break
    case 'help':
      showHelp()
      break
    default:
      // Show all info if no command specified
      await getAllInfo()
  }
}

main()
