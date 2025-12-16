# CodePark JavaScript Services - Background Manager

## Overview

This guide explains how to run all 12 JavaScript services simultaneously in the background with proper logging, process management, and health checks.

**Port Conflict Resolution:** The port conflict between `code-compiler` and `code-quality-dashboard` has been fixed. `code-quality-dashboard` now uses port **3011** instead of 3001.

---

## Quick Start

### Linux/macOS

```bash
# Navigate to the JavaScript directory
cd Coding/Languages/JavaScript

# Make the script executable
chmod +x start-all-services.sh

# Start all services in background
./start-all-services.sh start

# Check status
./start-all-services.sh status

# Stop all services
./start-all-services.sh stop

# View logs
./start-all-services.sh logs
```

### Windows (PowerShell)

```powershell
# Navigate to the JavaScript directory
cd Coding\Languages\JavaScript

# Set execution policy if needed (run once)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Start all services in background
.\start-all-services.ps1 start

# Check status
.\start-all-services.ps1 status

# Stop all services
.\start-all-services.ps1 stop

# View logs
.\start-all-services.ps1 logs
```

---

## Available Commands

### Start Services

Starts all 12 services in background:

**Linux/macOS:**
```bash
./start-all-services.sh start
```

**Windows:**
```powershell
.\start-all-services.ps1 start
```

**What it does:**
- ✅ Checks Node.js and npm installation
- ✅ Verifies all required ports are available
- ✅ Creates logs directory if needed
- ✅ Starts each service in background
- ✅ Waits for each service to be ready
- ✅ Displays summary with URLs and PIDs
- ✅ Logs all output to individual log files

### Stop Services

Stops all running services:

**Linux/macOS:**
```bash
./start-all-services.sh stop
```

**Windows:**
```powershell
.\start-all-services.ps1 stop
```

### Check Status

Shows status of all services:

**Linux/macOS:**
```bash
./start-all-services.sh status
```

**Windows:**
```powershell
.\start-all-services.ps1 status
```

### Restart Services

Stops and starts all services:

**Linux/macOS:**
```bash
./start-all-services.sh restart
```

**Windows:**
```powershell
.\start-all-services.ps1 restart
```

### View Logs

Open logs directory or view specific service logs:

**Linux/macOS:**
```bash
# List all log files
./start-all-services.sh logs

# View specific service logs
./start-all-services.sh logs:code-compiler
./start-all-services.sh logs:math-calculator

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

---

## Service URLs

Once all services are running, access them at:

| Service | Port | URL |
|---------|------|-----|
| Web RTC Chat | 3000 | http://localhost:3000 |
| Code Compiler | 3001 | http://localhost:3001 |
| Code Quality Dashboard | 3011 | http://localhost:3011 |
| AI Code Review | 3002 | http://localhost:3002/review |
| Mobile Companion | 3003 | http://localhost:3003/notify |
| GitHub Integration | 3004 | http://localhost:3004/auth |
| Config Management | 3005 | http://localhost:3005/config |
| Analytics Engine | 3006 | http://localhost:3006/query |
| Audit Logging | 3007 | http://localhost:3007/logs |
| CI/CD Pipeline | 3008 | http://localhost:3008/status |
| Webhook System | 3009 | http://localhost:3009/register |
| Math Calculator | 4000 | http://localhost:4000/api/docs |

---

## Port Assignments

All services have been assigned unique ports to prevent conflicts:

```
web-rtc-chat                → 3000
code-compiler               → 3001
ai-code-review-assistant    → 3002
mobile-companion-app        → 3003
github-integration          → 3004
advanced-config-management  → 3005
analytics-insights-engine   → 3006
advanced-audit-logging      → 3007
ci-cd-pipeline              → 3008
webhook-system              → 3009
code-quality-dashboard      → 3011 (previously 3001)
math-calculator             → 4000
```

---

## File Locations

### Logs Directory

```
Coding/Languages/JavaScript/logs/
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
Coding/Languages/JavaScript/pids/
├── web-rtc-chat.pid
├── code-compiler.pid
├── all_pids.txt              (all PIDs for bulk operations)
└── ...
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**

1. **Find what's using the port:**

   **Linux/macOS:**
   ```bash
   lsof -i :3001
   ```
   
   **Windows (PowerShell):**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Kill the process:**

   **Linux/macOS:**
   ```bash
   kill -9 <PID>
   ```
   
   **Windows (PowerShell):**
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

3. **Try starting again:**
   ```bash
   ./start-all-services.sh start  # or .ps1 for Windows
   ```

### Service Failed to Start

**Check the service log:**

**Linux/macOS:**
```bash
cat logs/service-name.log
# or follow in real-time
tail -f logs/service-name.log
```

**Windows:**
```powershell
Get-Content logs\service-name.log -Tail 50
```

### Permission Denied (Linux/macOS)

**Make the script executable:**
```bash
chmod +x start-all-services.sh
```

### Execution Policy Error (Windows)

**Allow script execution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Services Keep Dying

1. Check if Node.js is installed: `node --version`
2. Check if npm is installed: `npm --version`
3. Verify dependencies are installed in each service
4. Check logs for specific error messages

---

## Manual Commands

If you prefer to start services manually:

**Linux/macOS:**
```bash
cd web-rtc-chat && PORT=3000 npm start &
cd ../code-compiler && PORT=3001 npm start &
cd ../code-quality-dashboard && PORT=3011 npm start &
# ... and so on
```

**Windows (PowerShell):**
```powershell
cd web-rtc-chat; $env:PORT=3000; npm start
# In new terminal:
cd code-compiler; $env:PORT=3001; npm start
# ... and so on
```

---

## Monitoring Services

### Check All Services Status

```bash
./start-all-services.sh status
```

### Watch Logs in Real-Time

**Linux/macOS:**
```bash
# Follow specific service
tail -f logs/code-compiler.log

# Follow all logs (requires `multitail`)
multitail logs/*.log

# Or use watch
watch -n 1 'tail -3 logs/*.log'
```

**Windows (PowerShell):**
```powershell
# Follow specific service
Get-Content logs\code-compiler.log -Wait

# List recent errors
Get-Content logs\*.log | Select-String "error" -Context 2
```

### Performance Monitoring

**Check process resources:**

**Linux/macOS:**
```bash
ps aux | grep node
```

**Windows (PowerShell):**
```powershell
Get-Process node | Select-Object ProcessName,Id,WorkingSet,CPU
```

---

## Environment Variables

Customize service behavior with environment variables:

```bash
# Override port for specific service
PORT=5000 npm start

# Set environment (development/production)
NODE_ENV=production npm start

# Enable debug logging
DEBUG=* npm start
```

---

## Graceful Shutdown

The scripts handle graceful shutdown:

- **Linux/macOS:** Press `Ctrl+C` or run `./start-all-services.sh stop`
- **Windows:** Run `.\start-all-services.ps1 stop` or close the terminal

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

2. **Enable clustering (for multi-core systems):**
   - Some services support clustering in their configuration
   - Check individual service documentation

3. **Use a process manager for production:**
   - Consider PM2, Forever, or similar for production deployments
   - These scripts are suitable for development

4. **Monitor memory usage:**
   ```bash
   watch -n 1 'ps aux | grep node'
   ```

---

## Architecture

### How It Works

1. **Pre-flight Checks:**
   - Validates Node.js and npm installation
   - Checks all required ports are available
   - Creates necessary directories

2. **Service Startup:**
   - Each service starts in its own process
   - Runs in background (detached from terminal)
   - Output redirected to log files

3. **Health Checks:**
   - Waits for each service to be ready
   - Verifies service is listening on its port
   - Continues even if service takes longer (with warning)

4. **Process Tracking:**
   - Stores PIDs in `pids/` directory
   - Allows status checking and graceful shutdown
   - Enables individual service management

---

## Common Issues

### All Services Stop After Starting

**Check logs:**
```bash
ls -lh logs/
cat logs/code-compiler.log  # Check first failed service
```

**Common causes:**
- Missing npm dependencies: `npm install` in each service
- Incompatible Node.js version: Check `engines` in package.json
- Environment variables not set correctly

### Services Use High Memory

**Reduce number of services running:**
- Start only needed services manually
- Use individual `npm start` commands

### API Endpoints Not Responding

**Verify service is running:**
```bash
./start-all-services.sh status

# Check specific service
curl http://localhost:3000/health
```

**Check firewall:**
- Ensure localhost ports are not blocked
- Windows Firewall may block Node.js by default

---

## Advanced Usage

### Custom Port Assignment

Edit the port mappings in the script:

**start-all-services.sh (line 17):**
```bash
declare -A PORTS=(
    ["service-name"]=NEW_PORT
)
```

**start-all-services.ps1 (line 20):**
```powershell
$Ports = @{
    'service-name' = NEW_PORT
}
```

### Running Subset of Services

**Linux/macOS:**
```bash
# Edit start-all-services.sh
# Modify NODE_SERVICES array to include only services you need
```

**Windows:**
```powershell
# Edit start-all-services.ps1
# Modify $NodeServices array to include only services you need
```

---

## Support

For issues or questions:

1. Check `logs/` directory for error messages
2. Verify port availability
3. Ensure Node.js version compatibility
4. Review individual service documentation
5. Check GitHub repository for updates

---

**Last Updated:** 2025-12-16  
**Compatible:** Node.js 18+, npm 9+
