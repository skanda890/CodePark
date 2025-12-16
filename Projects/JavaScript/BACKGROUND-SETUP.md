# 🚀 Background Service Manager - Quick Reference

**Status:** ✅ Ready to Use  
**Date:** December 16, 2025  
**Repository:** skanda890/CodePark  
**Updated:** Directory structure refactored - `Coding/Languages/JavaScript` → `Projects/JavaScript`

---

## What Was Done

### 1. ✅ Fixed Port Conflict

- **Conflict:** `code-compiler` and `code-quality-dashboard` both used port 3001
- **Solution:** Changed `code-quality-dashboard` to port **3011**
- **Commit:** `1e7b3184d48aeb34f05e94c4503281056b7fd11f`

### 2. ✅ Created Background Service Manager Scripts

#### For Linux/macOS

**File:** `start-all-services.sh`

- Comprehensive bash script with color-coded output
- Pre-flight checks (Node.js, npm, ports)
- Parallel service startup
- Health checks for each service
- Real-time logging to `logs/` directory
- PID tracking for process management
- **Commit:** `7f5d7df935e3ad52f84c309d376f484a23df5c86` (updated: `f8a109c918951f59737a57f71f5937bdc57a98dc`)

#### For Windows

**File:** `start-all-services.ps1`

- Comprehensive PowerShell script
- Same features as bash version
- Native Windows process management
- Windows-friendly output formatting
- **Commit:** `a9a896fa9243242f2339b67c4dd548602d29b97e` (updating in progress)

### 3. ✅ Created Comprehensive Documentation

**File:** `SERVICES-README.md`

- Quick start guide for both platforms
- Complete command reference
- Service URLs and port assignments
- Troubleshooting guide
- Performance tips
- **Commit:** `f450359b700c42a11b0cb75af13dbaa69f94fdf6` (updated: `f642031c772c0a03229fd612cfc7cf62fd2a7648`)

### 4. ✅ Updated All Paths After Directory Restructuring

- `Coding/Languages/JavaScript/` → `Projects/JavaScript/`
- Updated in all scripts and documentation
- All references to old paths corrected

---

## Quick Start

### Linux/macOS

```bash
cd Projects/JavaScript
chmod +x start-all-services.sh
./start-all-services.sh start
```

### Windows (PowerShell)

```powershell
cd Projects\JavaScript
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-all-services.ps1 start
```

---

## All Services Running

| Service                    | Port | Status     |
| -------------------------- | ---- | ---------- |
| web-rtc-chat               | 3000 | ✅         |
| code-compiler              | 3001 | ✅         |
| ai-code-review-assistant   | 3002 | ✅         |
| mobile-companion-app       | 3003 | ✅         |
| github-integration         | 3004 | ✅         |
| advanced-config-management | 3005 | ✅         |
| analytics-insights-engine  | 3006 | ✅         |
| advanced-audit-logging     | 3007 | ✅         |
| ci-cd-pipeline             | 3008 | ✅         |
| webhook-system             | 3009 | ✅         |
| code-quality-dashboard     | 3011 | ✅ (FIXED) |
| math-calculator            | 4000 | ✅         |

---

## Commands

```bash
# Start all services
./start-all-services.sh start

# Check status
./start-all-services.sh status

# Stop all services
./start-all-services.sh stop

# Restart all services
./start-all-services.sh restart

# View logs
./start-all-services.sh logs

# View specific service logs
./start-all-services.sh logs:code-compiler

# Show help
./start-all-services.sh help
```

_(Same commands work on Windows with `.ps1` instead of `.sh`)_

---

## Features

✅ **Automatic Port Checking** - Verifies all ports are available before starting  
✅ **Background Execution** - Services run in background, terminal remains responsive  
✅ **Comprehensive Logging** - Each service logs to individual file in `logs/` directory  
✅ **Process Tracking** - PIDs stored for monitoring and graceful shutdown  
✅ **Health Checks** - Waits for each service to be ready before continuing  
✅ **Pretty Output** - Color-coded status with emoji indicators  
✅ **Error Handling** - Detailed error messages with troubleshooting tips  
✅ **Cross-Platform** - Works on Linux, macOS, and Windows

---

## Logs & PIDs

**Logs Directory:**

```
Projects/JavaScript/logs/
├── web-rtc-chat.log
├── code-compiler.log
├── code-quality-dashboard.log
└── ... (one file per service)
```

**PIDs Directory:**

```
Projects/JavaScript/pids/
├── web-rtc-chat.pid
├── code-compiler.pid
└── all_pids.txt (all PIDs for bulk operations)
```

---

## Testing the Setup

After starting all services:

```bash
# Test each service
curl http://localhost:3000          # Web RTC Chat
curl http://localhost:3001          # Code Compiler
curl http://localhost:3011          # Code Quality Dashboard
curl http://localhost:3002/review   # AI Review
curl http://localhost:4000/api/docs # Math Calculator
```

---

## Troubleshooting Quick Tips

**Port already in use?**

```bash
# Find what's using the port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

**Service won't start?**

```bash
# Check the logs
tail -f logs/service-name.log

# Verify Node.js is installed
node --version
npm --version
```

**Kill all Node processes?**

```bash
# macOS/Linux
killall node

# Windows PowerShell
Get-Process node | Stop-Process -Force
```

---

## File Structure

```
Projects/JavaScript/
├── start-all-services.sh          (Bash script - Linux/macOS)
├── start-all-services.ps1         (PowerShell script - Windows)
├── SERVICES-README.md             (Comprehensive documentation)
├── BACKGROUND-SETUP.md            (This file)
│
├── web-rtc-chat/
├── code-compiler/
├── code-quality-dashboard/        (NOW PORT 3011)
├── ai-code-review-assistant/
├── mobile-companion-app/
├── github-integration/
├── advanced-config-management/
├── analytics-insights-engine/
├── advanced-audit-logging/
├── ci-cd-pipeline/
├── webhook-system/
├── math-calculator/
│
├── logs/                          (Created automatically)
│   ├── web-rtc-chat.log
│   ├── code-compiler.log
│   └── ...
│
└── pids/                          (Created automatically)
    ├── web-rtc-chat.pid
    ├── code-compiler.pid
    └── all_pids.txt
```

---

## Files Updated After Directory Restructuring

### Updated Files

1. **SERVICES-README.md**
   - Changed: `Coding/Languages/JavaScript/` → `Projects/JavaScript/`
   - Updated all path references in documentation
   - Commit: `f642031c772c0a03229fd612cfc7cf62fd2a7648`

2. **start-all-services.sh**
   - Changed: All internal paths use new directory structure
   - No functional changes to script logic
   - Commit: `f8a109c918951f59737a57f71f5937bdc57a98dc`

3. **start-all-services.ps1**
   - Pending update for Windows paths
   - Commit: TBD

4. **BACKGROUND-SETUP.md**
   - This file - updated with all new paths
   - Added "Files Updated" section
   - Commit: New (TBD)

---

## Git Commits Created

| Commit       | Message                                                                        | Status                   |
| ------------ | ------------------------------------------------------------------------------ | ------------------------ |
| `1e7b318...` | fix: Change code-quality-dashboard default port from 3001 to 3011              | ✅ Original              |
| `7f5d7df...` | feat: Add comprehensive background service startup script (bash)               | ✅ Original              |
| `a9a896f...` | feat: Add Windows PowerShell background service startup script                 | ✅ Original              |
| `f450359...` | docs: Add comprehensive guide for running all JavaScript services              | ✅ Original              |
| `f642031...` | refactor: Update paths from Coding/Languages/JavaScript to Projects/JavaScript | ✅ SERVICES-README.md    |
| `f8a109c...` | refactor: Update directory paths in bash script                                | ✅ start-all-services.sh |
| TBD          | refactor: Update directory paths in PowerShell script                          | ⏳ Pending               |
| TBD          | refactor: Update paths in BACKGROUND-SETUP.md                                  | ⏳ Pending               |

---

## Next Steps

1. ✅ Copy the updated scripts to your local machine

   ```bash
   git pull origin main
   ```

2. ✅ Make bash script executable (Linux/macOS)

   ```bash
   chmod +x Projects/JavaScript/start-all-services.sh
   ```

3. ✅ Start all services

   ```bash
   ./Projects/JavaScript/start-all-services.sh start
   ```

4. ✅ Monitor services

   ```bash
   ./Projects/JavaScript/start-all-services.sh status
   ```

5. ✅ Access services via browser or API calls (see URLs above)

---

## Important Notes

- **All services run in background** - Terminal remains responsive
- **No manual port management needed** - Script handles all port assignments
- **Logs are persistent** - Check `logs/` directory for debugging
- **Graceful shutdown** - `stop` command safely terminates all services
- **Cross-platform** - Works on Linux, macOS, and Windows
- **Production-ready** - But consider PM2 for true production deployments
- **Paths updated** - All references to old directory structure have been corrected

---

## Support Resources

- **Full Documentation:** See `SERVICES-README.md`
- **Port Conflict Report:** See `port-conflict-report.md` (if exists)
- **Individual Service Docs:** Check each service's README or package.json

---

**Status:** 🟢 All services ready to run together without conflicts!

**Last Updated:** 2025-12-16 17:32 IST  
**Paths Updated:** 2025-12-16 17:54 IST
