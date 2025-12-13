# BIOS-Info

A comprehensive Node.js utility for retrieving and displaying detailed system hardware and BIOS information.

## Features

✨ **Comprehensive System Information:**
- BIOS details (manufacturer, version, release date, revision)
- System information (manufacturer, model, type, UUID)
- CPU specifications (brand, speed, cores, cache)
- Memory/RAM details (total, available, used, usage percentage)
- Operating System information (platform, distro, kernel, hostname)
- GPU/Graphics card information
- Network interfaces and configuration

🎨 **Enhanced Output:**
- Color-coded terminal output for better readability
- Formatted sections and headers
- Structured JSON export functionality
- Command-line interface with multiple options

⚡ **Easy to Use:**
- Simple command-line commands for specific information
- Export data to JSON file for further processing
- Help documentation built-in

## Installation

```bash
npm install
```

## Usage

### Run All System Information
```bash
npm start
# or
node server.js
```

### View Specific Information

**BIOS Information:**
```bash
node server.js bios
# or
npm run info:bios
```

**System Information:**
```bash
node server.js system
npm run info:system
```

**CPU Information:**
```bash
node server.js cpu
npm run info:cpu
```

**Memory Information:**
```bash
node server.js memory
npm run info:memory
```

**OS Information:**
```bash
node server.js os
npm run info:os
```

**GPU Information:**
```bash
node server.js gpu
npm run info:gpu
```

**Network Information:**
```bash
node server.js network
npm run info:network
```

### Export All Information

Export all system information to a JSON file:
```bash
node server.js export
# or
npm run export
```

This creates a `system-info.json` file with all gathered data and a timestamp.

### Get Help

```bash
node server.js help
# or
npm run help
```

## Available npm Scripts

```json
"info:all": "node server.js"           # Show all system information
"info:bios": "node server.js bios"    # BIOS only
"info:system": "node server.js system" # System only
"info:cpu": "node server.js cpu"      # CPU only
"info:memory": "node server.js memory" # Memory only
"info:os": "node server.js os"        # OS only
"info:gpu": "node server.js gpu"      # GPU only
"info:network": "node server.js network" # Network only
"export": "node server.js export"      # Export to JSON
"help": "node server.js help"         # Show help
```

## Output Example

```
==================================================
BIOS INFORMATION
==================================================

  Manufacturer: QEMU
  Version: 2.5.0
  Release Date: 01/01/2007
  Revision: 1.0

==================================================
CPU INFORMATION
==================================================

  Manufacturer: Intel(R) Corporation
  Brand: QEMU Virtual CPU version 2.5.0+
  Speed: 2.40 GHz
  Cores: 4
  Physical Cores: 4
  Processors: 1
  Cache: N/A
```

## JSON Export Format

When using the `export` command, the generated `system-info.json` file includes:

```json
{
  "bios": { ...BIOS info... },
  "system": { ...System info... },
  "cpu": { ...CPU info... },
  "memory": { ...Memory info... },
  "os": { ...OS info... },
  "gpu": { ...GPU info... },
  "network": [...Network interfaces...],
  "timestamp": "2025-12-13T10:11:12.000Z"
}
```

## Requirements

- **Node.js:** 12.0.0 or higher
- **systeminformation:** ^5.16.0 (automatically installed via npm)

## Dependencies

- [`systeminformation`](https://www.npmjs.com/package/systeminformation) - OS and system information library

## Use Cases

- System auditing and inventory
- Hardware troubleshooting
- Performance monitoring and analysis
- System documentation and reporting
- Automated system health checks
- CI/CD pipeline system validation

## Error Handling

The utility includes robust error handling:
- Individual function error messages in red text
- Graceful fallback if specific system info is unavailable
- Continues fetching other information if one fails

## Platform Support

- ✅ Linux
- ✅ Windows (Hyper-V, VMware, VirtualBox)
- ✅ macOS
- ✅ Virtual/Cloud environments

## License

MIT

## Author

SkandaBT

---

**Last Updated:** December 13, 2025
