# 🔧 Auto-Update Troubleshooting Guide

Complete troubleshooting guide for CodePark's automated dependency update system.

---

## 🐛 Common Issues

### 1. Task Not Running Automatically

**Symptoms:**
- No new log files in `C:\Temp`
- Last run time shows old date
- Dependencies not updating

**Diagnosis:**

```powershell
# Check if task exists
Get-ScheduledTask -TaskName "CodePark-Daily-Update" -ErrorAction SilentlyContinue

# Check task status
(Get-ScheduledTask -TaskName "CodePark-Daily-Update").State
# Expected: Ready

# Check last run
Get-ScheduledTaskInfo -TaskName "CodePark-Daily-Update" | 
  Select-Object LastRunTime, LastTaskResult, NextRunTime
# LastTaskResult 0 = success, non-zero = error
```

**Solutions:**

1. **Task doesn't exist:**
   ```powershell
   cd C:\path\to\CodePark\Coding\Scripts\auto-update
   .\setup-windows-task.ps1
   ```

2. **Task is disabled:**
   ```powershell
   Enable-ScheduledTask -TaskName "CodePark-Daily-Update"
   ```

3. **Wrong time zone:**
   ```powershell
   # Check system time
   Get-Date
   
   # Update trigger to correct time
   $Trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
   Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger $Trigger
   ```

4. **Network requirement not met:**
   - Task only runs when network is available
   - Check network connectivity at scheduled time

---

### 2. Permission/Execution Policy Errors

**Symptoms:**
```
File cannot be loaded because running scripts is disabled on this system
```

**Solutions:**

1. **Check current policy:**
   ```powershell
   Get-ExecutionPolicy -List
   ```

2. **Set RemoteSigned for current user:**
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

3. **Temporary bypass (for testing only):**
   ```powershell
   PowerShell.exe -ExecutionPolicy Bypass -File .\update-dependencies.ps1
   ```

4. **Unblock downloaded scripts:**
   ```powershell
   Get-ChildItem .\Coding\Scripts\auto-update\*.ps1 | Unblock-File
   ```

---

### 3. npm Installation Failures

**Symptoms:**
- Log shows "Installation failed"
- Exit code non-zero
- Backup restored automatically

**Diagnosis:**

```powershell
# Check npm and Node.js
npm --version
node --version

# Test npm registry access
npm ping

# Check network
Test-NetConnection registry.npmjs.org -Port 443

# View error in logs
Get-Content (Get-ChildItem C:\Temp\codepark-update-*.log | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1).FullName | 
  Select-String "ERROR" -Context 5
```

**Solutions:**

1. **Network issues:**
   ```powershell
   # Test connectivity
   Test-Connection registry.npmjs.org
   
   # Check proxy settings
   npm config get proxy
   npm config get https-proxy
   
   # Clear npm cache
   npm cache clean --force
   ```

2. **Corrupted package-lock.json:**
   ```powershell
   # Delete and regenerate
   Remove-Item package-lock.json
   npm install
   ```

3. **Disk space issues:**
   ```powershell
   # Check free space
   Get-PSDrive C | Select-Object Used, Free
   
   # Clean npm cache if needed
   npm cache clean --force
   ```

4. **npm registry issues:**
   ```powershell
   # Use different registry temporarily
   npm install --registry https://registry.npmjs.org/
   ```

---

### 4. No Logs Created

**Symptoms:**
- No files in `C:\Temp\codepark-update-*.log`
- Can't verify if task ran

**Solutions:**

1. **Create temp directory:**
   ```powershell
   New-Item -ItemType Directory -Path C:\Temp -Force
   ```

2. **Check write permissions:**
   ```powershell
   # Test write access
   "test" | Out-File C:\Temp\test.txt
   Remove-Item C:\Temp\test.txt
   ```

3. **Use custom log directory:**
   ```powershell
   # Create custom directory
   New-Item -ItemType Directory -Path C:\CodeParkLogs -Force
   
   # Update task to use custom directory
   # Edit task action argument to include:
   # -LogDir "C:\CodeParkLogs"
   ```

4. **Check task output:**
   ```powershell
   # View task event log
   Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' |
     Where-Object {$_.Message -like '*CodePark-Daily-Update*'} |
     Select-Object -First 10 TimeCreated, Message
   ```

---

### 5. Backups Not Working

**Symptoms:**
- No files in `backups/` directory
- Rollback fails

**Solutions:**

1. **Check backup directory:**
   ```powershell
   cd C:\path\to\CodePark
   
   # List backups
   Get-ChildItem .\backups\package-lock-*.json
   
   # If directory doesn't exist, create it
   New-Item -ItemType Directory -Path .\backups -Force
   ```

2. **Manual backup:**
   ```powershell
   # Create backup manually before update
   $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
   Copy-Item package-lock.json ".\backups\package-lock-$timestamp.json"
   ```

3. **Check permissions:**
   ```powershell
   # Check if script can write to backups
   "test" | Out-File .\backups\test.txt
   Remove-Item .\backups\test.txt
   ```

---

### 6. Task Runs But Updates Fail

**Symptoms:**
- Task shows as "Running" or "Ready"
- Log shows errors
- Dependencies not updated

**Diagnosis:**

```powershell
# Check last result
Get-ScheduledTaskInfo -TaskName "CodePark-Daily-Update" | 
  Select-Object LastTaskResult
# 0 = success, other = error code

# View complete log
$log = Get-ChildItem C:\Temp\codepark-update-*.log | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1
Get-Content $log.FullName
```

**Solutions:**

1. **Run manually to debug:**
   ```powershell
   cd C:\path\to\CodePark
   .\Coding\Scripts\auto-update\update-dependencies.ps1 -Verbose
   ```

2. **Check script location:**
   ```powershell
   # Verify script exists
   Test-Path .\Coding\Scripts\auto-update\update-dependencies.ps1
   ```

3. **Check project structure:**
   ```powershell
   # Verify package.json exists
   Test-Path .\package.json
   ```

---

### 7. Security Vulnerabilities After Update

**Symptoms:**
- Log shows high/critical vulnerabilities
- Security audit fails

**Solutions:**

1. **Review audit results:**
   ```powershell
   cd C:\path\to\CodePark
   npm audit
   ```

2. **Attempt automatic fix:**
   ```powershell
   npm audit fix
   ```

3. **Force update to latest:**
   ```powershell
   npm audit fix --force
   ```

4. **Check specific package:**
   ```powershell
   npm audit --json | ConvertFrom-Json | 
     Select-Object -ExpandProperty vulnerabilities
   ```

5. **Rollback if critical:**
   ```powershell
   # Use backup from before update
   $backup = Get-ChildItem .\backups\package-lock-*.json | 
     Sort-Object LastWriteTime -Descending | 
     Select-Object -First 2 | 
     Select-Object -Last 1
   
   Copy-Item $backup.FullName .\package-lock.json
   npm ci
   ```

---

## 🔍 Diagnostic Commands

### Check System Status

```powershell
# Complete system check
function Test-AutoUpdateSystem {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "System Diagnostic" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # 1. Task exists?
    $task = Get-ScheduledTask -TaskName "CodePark-Daily-Update" -ErrorAction SilentlyContinue
    if ($task) {
        Write-Host "✅ Task exists" -ForegroundColor Green
        Write-Host "   State: $($task.State)"
        
        $info = Get-ScheduledTaskInfo -TaskName "CodePark-Daily-Update"
        Write-Host "   Last Run: $($info.LastRunTime)"
        Write-Host "   Next Run: $($info.NextRunTime)"
        Write-Host "   Result: $($info.LastTaskResult)"
    } else {
        Write-Host "❌ Task not found" -ForegroundColor Red
    }
    
    # 2. Script exists?
    $scriptPath = ".\Coding\Scripts\auto-update\update-dependencies.ps1"
    if (Test-Path $scriptPath) {
        Write-Host "✅ Update script exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Update script not found" -ForegroundColor Red
    }
    
    # 3. npm available?
    try {
        $npmVersion = npm --version 2>$null
        Write-Host "✅ npm available (v$npmVersion)" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm not found" -ForegroundColor Red
    }
    
    # 4. Logs exist?
    $logs = Get-ChildItem C:\Temp\codepark-update-*.log -ErrorAction SilentlyContinue
    if ($logs) {
        Write-Host "✅ Logs found ($($logs.Count) files)" -ForegroundColor Green
        $latest = $logs | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "   Latest: $($latest.Name)"
    } else {
        Write-Host "⚠️  No logs found" -ForegroundColor Yellow
    }
    
    # 5. Backups exist?
    $backups = Get-ChildItem .\backups\package-lock-*.json -ErrorAction SilentlyContinue
    if ($backups) {
        Write-Host "✅ Backups found ($($backups.Count) files)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No backups found" -ForegroundColor Yellow
    }
    
    # 6. Project structure?
    if (Test-Path package.json) {
        Write-Host "✅ package.json exists" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json not found" -ForegroundColor Red
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

# Run diagnostic
cd C:\path\to\CodePark
Test-AutoUpdateSystem
```

### View Latest Log with Errors

```powershell
function Show-LatestErrors {
    $log = Get-ChildItem C:\Temp\codepark-update-*.log | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($log) {
        Write-Host "Latest log: $($log.Name)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Get-Content $log.FullName | Select-String "ERROR|WARNING" | 
            ForEach-Object { Write-Host $_ -ForegroundColor $(if ($_ -match 'ERROR') { 'Red' } else { 'Yellow' }) }
    } else {
        Write-Host "No logs found" -ForegroundColor Red
    }
}

Show-LatestErrors
```

---

## 🔄 Reset & Reinstall

### Complete Reset

If all else fails, completely reset the auto-update system:

```powershell
# 1. Remove task
Unregister-ScheduledTask -TaskName "CodePark-Daily-Update" -Confirm:$false

# 2. Clean logs
Remove-Item C:\Temp\codepark-update-*.log

# 3. Clean backups (optional)
# Remove-Item .\backups\package-lock-*.json

# 4. Reinstall
cd C:\path\to\CodePark\Coding\Scripts\auto-update
.\setup-windows-task.ps1 -Force

# 5. Test
.\update-dependencies.ps1 -DryRun -Verbose
```

---

## 📞 Getting Help

### Before Opening an Issue

1. Run system diagnostic (see above)
2. Check latest log for errors
3. Try manual test run with `-Verbose`
4. Check if issue persists after reset

### When Opening an Issue

Include:

1. **System info:**
   ```powershell
   Get-ComputerInfo | Select-Object OsName, OsVersion, OsArchitecture
   npm --version
   node --version
   ```

2. **Task info:**
   ```powershell
   Get-ScheduledTask -TaskName "CodePark-Daily-Update" | Format-List *
   Get-ScheduledTaskInfo -TaskName "CodePark-Daily-Update"
   ```

3. **Latest log** (sanitize any sensitive info)

4. **Error messages** (exact text)

5. **What you tried** (steps to reproduce)

### Support Channels

- **GitHub Issues**: [github.com/skanda890/CodePark/issues](https://github.com/skanda890/CodePark/issues)
- **Discussions**: [github.com/skanda890/CodePark/discussions](https://github.com/skanda890/CodePark/discussions)

---

## 📚 Related Documentation

- [README.md](./README.md) - Full documentation
- [QUICKSTART.md](./QUICKSTART.md) - Setup guide
- Main [README.md](../../../README.md) - Project overview

---

**Last Updated**: December 2024
