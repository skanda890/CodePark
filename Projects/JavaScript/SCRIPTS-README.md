# 🚀 Background Service Scripts - Complete Guide

**Quick Start:** [Jump to Quick Start](#quick-start)  
**Platform:** Linux, macOS, Windows  
**Status:** ✅ Production Ready  

---

## Overview

This directory contains two scripts that manage running all 12 JavaScript services simultaneously in the background:

- **Linux/macOS:** `start-all-services.sh` (Bash script)
- **Windows:** `start-all-services.ps1` (PowerShell script)

Both scripts provide identical functionality with platform-specific implementations.

---

## Quick Start

### Linux/macOS

```bash
# 1. Navigate to the JavaScript directory
cd Projects/JavaScript

# 2. Make the script executable (one-time)
chmod +x start-all-services.sh

# 3. Start all services
./start-all-services.sh start

# 4. View status
./start-all-services.sh status

# 5. Stop all services
./start-all-services.sh stop
```

### Windows (PowerShell)

```powershell
# 1. Navigate to the JavaScript directory
cd Projects\JavaScript

# 2. Set execution policy (one-time, run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Start all services
.\start-all-services.ps1 start

# 4. View status
.\start-all-services.ps1 status

# 5. Stop all services
.\start-all-services.ps1 stop
```

---

## Prerequisites

### Required
- **Node.js** (version 18 or higher)
- **npm** (version 9 or higher)

### Verify Installation

```bash
# Check Node.js
node --version

# Check npm
npm --version
```

If not installed:
- **macOS:** `brew install node`
- **Linux (Ubuntu/Debian):** `sudo apt-get install nodejs npm`
- **Linux (Fedora):** `sudo dnf install nodejs npm`
- **Windows:** Download from [nodejs.org](https://nodejs.org)

---

## Scripts Explained

### start-all-services.sh (Linux/macOS)

**Location:** `Projects/JavaScript/start-all-services.sh`

**What it does:**
1. Checks Node.js and npm are installed
2. Verifies all required ports (3000-3009, 3011, 4000) are available
3. Creates necessary directories (`logs/`, `pids/`)
4. Starts all 12 services in background
5. Waits for each service to be ready
6. Displays summary with URLs and process IDs
7. Logs all output to individual files in `logs/` directory

**Features:**
- ✅ Color-coded terminal output
- ✅ Individual service logging
- ✅ Process tracking for management
- ✅ Graceful shutdown support
- ✅ Health checks for each service

### start-all-services.ps1 (Windows)

**Location:** `Projects/JavaScript/start-all-services.ps1`

**What it does:**
- Same functionality as bash version
- Windows-native implementation using PowerShell
- Native Windows process management
- Compatible with Windows Terminal and PowerShell ISE

---

## Commands Reference

### Start Services

Starts all 12 services in background.

**Linux/macOS:**
```bash
./start-all-services.sh start
```

**Windows:**
```powershell
.\start-all-services.ps1 start
```

**Output:**
```
✓ All 12 services started successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SERVICES RUNNING IN BACKGROUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVICE                             PORT     STATUS
---                                 ---      ---
web-rtc-chat                        3000     ✅ Running
code-compiler                       3001     ✅ Running
...
```

### Stop Services

Stops all running services gracefully.

**Linux/macOS:**
```bash
./start-all-services.sh stop
```

**Windows:**
```powershell
.\start-all-services.ps1 stop
```

### Check Status

Shows status of all services (running, stopped, not started).

**Linux/macOS:**
```bash
./start-all-services.sh status
```

**Windows:**
```powershell
.\start-all-services.ps1 status
```

**Output:**
```
✓ web-rtc-chat (PID: 12345) - Running on port 3000
✓ code-compiler (PID: 12346) - Running on port 3001
⚠ code-quality-dashboard - Not started
✗ ai-code-review-assistant - Stopped (PID file exists but process not running)
```

### Restart Services

Stops all services and starts them again.

**Linux/macOS:**
```bash
./start-all-services.sh restart
```

**Windows:**
```powershell
.\start-all-services.ps1 restart
```

### View Logs

Open logs directory or view specific service logs.

**Linux/macOS:**
```bash
# List all log files
./start-all-services.sh logs

# View specific service logs (last 50 lines)
./start-all-services.sh logs:code-compiler

# Follow logs in real-time
tail -f logs/code-compiler.log
```

**Windows:**
```powershell
# Open logs directory
.\start-all-services.ps1 logs

# View specific service logs
Get-Content logs\code-compiler.log -Tail 50 -Wait
```

### Show Help

Displays usage information and available commands.

**Linux/macOS:**
```bash
./start-all-services.sh help
```

**Windows:**
```powershell
.\start-all-services.ps1 help
```

---

## Service Ports

All services are assigned unique ports to prevent conflicts:

| Service | Port | URL |
|---------|------|-----|
| web-rtc-chat | 3000 | http://localhost:3000 |
| code-compiler | 3001 | http://localhost:3001 |
| ai-code-review-assistant | 3002 | http://localhost:3002/review |
| mobile-companion-app | 3003 | http://localhost:3003/notify |
| github-integration | 3004 | http://localhost:3004/auth |
| advanced-config-management | 3005 | http://localhost:3005/config |
| analytics-insights-engine | 3006 | http://localhost:3006/query |
| advanced-audit-logging | 3007 | http://localhost:3007/logs |
| ci-cd-pipeline | 3008 | http://localhost:3008/status |
| webhook-system | 3009 | http://localhost:3009/register |
| code-quality-dashboard | 3011 | http://localhost:3011 |
| math-calculator | 4000 | http://localhost:4000/api/docs |

---

## File Locations

### Logs Directory

```
Projects/JavaScript/logs/
├── web-rtc-chat.log
├── code-compiler.log
├── code-quality-dashboard.log
├── ai-code-review-assistant.log
├── mobile-companion-app.log
├── github-integration.log
├── advanced-config-management.log
├── analytics-insights-engine.log
├── advanced-audit-logging.log
├── ci-cd-pipeline.log
├── webhook-system.log
└── math-calculator.log
```

### PIDs Directory

```
Projects/JavaScript/pids/
├── web-rtc-chat.pid
├── code-compiler.pid
├── [service-name].pid
└── all_pids.txt (all PIDs for bulk operations)
```

These directories are created automatically when the script runs.

---

## Common Issues & Solutions

### Issue: "Permission denied" (Linux/macOS)

**Error:**
```
bash: ./start-all-services.sh: Permission denied
```

**Solution:**
```bash
chmod +x start-all-services.sh
./start-all-services.sh start
```

---

### Issue: "Execution Policy" error (Windows)

**Error:**
```
PS> .\start-all-services.ps1 : File cannot be loaded because running scripts is disabled on this system
```

**Solution:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or for current session only
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

---

### Issue: "Port already in use"

**Error:**
```
[ERROR] Port 3001 is already in use (required by code-compiler)
```

**Solution:**

**Linux/macOS:**
```bash
# Find what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Try starting again
./start-all-services.sh start
```

**Windows:**
```powershell
# Find what's using the port
netstat -ano | findstr :3001

# Kill the process
Stop-Process -Id <PID> -Force

# Try starting again
.\start-all-services.ps1 start
```

---

### Issue: "Node.js not found"

**Error:**
```
[ERROR] Node.js is not installed
```

**Solution:**

Install Node.js:
- **macOS:** `brew install node`
- **Linux (Ubuntu):** `sudo apt-get install nodejs npm`
- **Windows:** Download from [nodejs.org](https://nodejs.org)

Verify installation:
```bash
node --version
npm --version
```

---

### Issue: "Service won't start"

**Check the logs:**

**Linux/macOS:**
```bash
cat logs/code-compiler.log
# or follow in real-time
tail -f logs/code-compiler.log
```

**Windows:**
```powershell
Get-Content logs\code-compiler.log -Tail 50
```

**Common causes:**
- Missing npm dependencies: Run `npm install` in service directory
- Incompatible Node.js version: Check `engines` in service's `package.json`
- Port already in use: Kill process using the port
- Missing environment variables: Check `.env` file

---

## Advanced Usage

### Running Subset of Services

To run only specific services:

**Option 1: Manual startup**
```bash
cd Projects/JavaScript/code-compiler
PORT=3001 npm start &

cd ../math-calculator
PORT=4000 npm start &
```

**Option 2: Edit script**
- Edit `start-all-services.sh` or `.ps1`
- Modify the `NODE_SERVICES` array to include only needed services
- Run the script

### Custom Port Assignment

Edit the port mappings in the script:

**In start-all-services.sh (around line 17):**
```bash
declare -A PORTS=(
    ["service-name"]=NEW_PORT
)
```

**In start-all-services.ps1 (around line 20):**
```powershell
$Ports = @{
    'service-name' = NEW_PORT
}
```

### Environment Variables

Customize service behavior:

```bash
# Set port for specific service
PORT=5000 npm start

# Set environment (development/production)
NODE_ENV=production npm start

# Enable debug logging
DEBUG=* npm start

# Increase memory allocation
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## Monitoring Services

### Real-time Log Monitoring

**Linux/macOS:**
```bash
# Watch all logs
watch -n 1 'tail -3 logs/*.log'

# Follow specific service
tail -f logs/code-compiler.log
```

**Windows:**
```powershell
# Follow specific service
Get-Content logs\code-compiler.log -Wait

# Find errors in logs
Get-Content logs\*.log | Select-String "error"
```

### Process Monitoring

**Linux/macOS:**
```bash
# List all Node processes
ps aux | grep node

# Monitor resources
top -p <PID>
```

**Windows:**
```powershell
# List all Node processes
Get-Process node

# Show detailed info
Get-Process node | Select-Object ProcessName,Id,WorkingSet,CPU,Threads
```

---

## Testing Services

After starting all services, verify they're working:

```bash
# Test specific services
curl http://localhost:3000          # Web RTC Chat
curl http://localhost:3001          # Code Compiler
curl http://localhost:3011          # Code Quality Dashboard
curl http://localhost:3002/review   # AI Review
curl http://localhost:4000/api/docs # Math Calculator
```

---

## Graceful Shutdown

The scripts handle graceful shutdown properly:

```bash
# Stop all services
./start-all-services.sh stop

# Or press Ctrl+C
```

Services will:
1. Stop accepting new requests
2. Complete existing requests
3. Close database connections
4. Exit gracefully

---

## Performance Tips

1. **Allocate sufficient memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Monitor resource usage:**
   ```bash
   # Watch memory and CPU
   watch -n 1 'ps aux | grep node'
   ```

3. **Reduce number of services if needed:**
   - Edit the script to start only necessary services
   - Manually start specific services instead

4. **For production use:**
   - Consider PM2 process manager
   - Enable clustering for multi-core systems
   - Use Docker containers

---

## Documentation

- **Comprehensive Guide:** See `SERVICES-README.md`
- **Quick Reference:** See `BACKGROUND-SETUP.md`
- **Port Conflicts:** See `port-conflict-report.md`

---

## Support

For issues or questions:

1. Check the logs in `logs/` directory
2. Verify Node.js and npm versions
3. Ensure all ports are available
4. Review service package.json for requirements
5. Check GitHub repository for updates

---

**Status:** 🟢 Ready to Use

**Last Updated:** 2025-12-16 17:57 IST
