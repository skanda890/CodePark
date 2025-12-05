# 🔄 Automated Daily Dependency Updater

Automatically updates CodePark dependencies to the latest bleeding-edge versions every day.

## 📋 Overview

This enhanced system:

- ✅ Runs **daily at 2:00 AM** (customizable)
- ✅ Removes `package-lock.json` and `node_modules`
- ✅ Installs latest `next` versions (pre-release)
- ✅ Backs up previous `package-lock.json`
- ✅ **Enhanced logging** with color-coded severity levels
- ✅ **Automatic rollback** on installation failure
- ✅ **Security audit** after installation
- ✅ **Smart error handling** with detailed diagnostics
- ✅ **Dry-run mode** for testing
- ✅ Cleans up old backups (keeps 7 days)

---

## 🚀 Quick Start

### Windows (Recommended)

```powershell
# Open PowerShell as Administrator
cd C:\path\to\CodePark\Coding\Scripts\auto-update

# Run setup script
.\setup-windows-task.ps1
```

That's it! The task will run daily at 2:00 AM automatically.

### Linux / macOS

```bash
# Navigate to auto-update directory
cd /path/to/CodePark/Coding/Scripts/auto-update

# Run setup script
chmod +x setup-cron.sh
./setup-cron.sh
```

---

## 📁 File Structure

```
Coding/Scripts/auto-update/
├── update-dependencies.ps1      # Windows update script (NEW ✨)
├── update-dependencies.sh       # Linux/macOS update script
├── setup-windows-task.ps1       # Windows task setup (ENHANCED ✨)
├── setup-cron.sh                # Linux/macOS cron setup
└── README.md                    # This file

backups/                         # Created automatically
└── package-lock-*.json          # Backup files (last 7 days)

C:\Temp/                         # Windows log directory
└── codepark-update-*.log        # Detailed log files
```

---

## ✨ What's New in Enhanced Version

### Windows PowerShell Script (`update-dependencies.ps1`)

1. **🎯 Robust Error Handling**
   - Prerequisite checks (npm, Node.js, project structure)
   - Graceful failure with detailed error messages
   - Automatic backup restoration on failure

2. **📊 Enhanced Logging**
   - Color-coded severity levels (INFO, SUCCESS, WARNING, ERROR, DEBUG)
   - Timestamped entries for easy debugging
   - Both console and file output

3. **🔒 Security Features**
   - Security audit after installation
   - Vulnerability count and severity reporting
   - RemoteSigned execution policy (safer than Bypass)

4. **🧑‍💻 Developer-Friendly**
   - Dry-run mode to preview changes
   - Verbose mode for detailed output
   - Custom log directory support
   - Parameter-based configuration

5. **🛠️ Improved Reliability**
   - Execution time tracking
   - Automatic cleanup of old backups
   - Progress indicators
   - Exit codes for monitoring

### Task Scheduler Setup (`setup-windows-task.ps1`)

1. **🔐 Security Improvements**
   - Runs without elevation (reduced attack surface)
   - Hidden window for silent operation
   - Network availability check
   - 2-hour timeout to prevent hanging

2. **🔁 Resilience**
   - Auto-restart on failure (up to 3 attempts)
   - 10-minute retry interval
   - Configurable schedule

3. **📝 Better Documentation**
   - Comprehensive usage instructions
   - Task management commands
   - Script testing examples
   - Visual formatting with Unicode

---

## 🔧 Configuration

### Change Update Time

**Windows:**

```powershell
# Option 1: Re-run setup with custom time
.\setup-windows-task.ps1 -Hour 3 -Minute 30  # 3:30 AM

# Option 2: Modify existing task
$Trigger = New-ScheduledTaskTrigger -Daily -At "3:30AM"
Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger $Trigger
```

**Linux/macOS:**

```bash
crontab -e
# Change: 0 2 * * * to: 0 3 * * *  (for 3 AM)
```

### Change Backup Retention

Edit `update-dependencies.ps1` (line ~110):

```powershell
Cleanup-OldBackups -BackupLocation $BackupDir -DaysToKeep 14  # Keep 14 days instead of 7
```

---

## 📊 Monitoring

### View Logs

```powershell
# Latest log file
Get-ChildItem C:\Temp\codepark-update-*.log |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  Get-Content

# All logs (sorted by date)
Get-ChildItem C:\Temp\codepark-update-*.log |
  Sort-Object LastWriteTime -Descending

# Follow live log (while running)
Get-Content C:\Temp\codepark-update-*.log -Wait -Tail 50
```

### Check Task Status

```powershell
# Task details
Get-ScheduledTask -TaskName "CodePark-Daily-Update" | Format-List *

# Last run result
Get-ScheduledTask -TaskName "CodePark-Daily-Update" | Get-ScheduledTaskInfo

# Task history (from Event Viewer)
Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' |
  Where-Object {$_.Message -like '*CodePark-Daily-Update*'} |
  Select-Object -First 10 TimeCreated, Message
```

### Security Audit Results

Logs show vulnerability counts:

```
[2024-12-05 02:05:32] [INFO] Security vulnerabilities found:
[2024-12-05 02:05:32] [ERROR]   Critical: 0
[2024-12-05 02:05:32] [WARNING]   High: 2
[2024-12-05 02:05:32] [INFO]   Moderate: 5
[2024-12-05 02:05:32] [INFO]   Low: 1
```

---

## 🧑‍💻 Testing & Development

### Test Update Script Manually

```powershell
cd C:\path\to\CodePark

# Normal run
.\Coding\Scripts\auto-update\update-dependencies.ps1

# Dry run (no changes made)
.\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun

# Verbose output
.\Coding\Scripts\auto-update\update-dependencies.ps1 -Verbose

# Custom log directory
.\Coding\Scripts\auto-update\update-dependencies.ps1 -LogDir "D:\MyLogs"

# Combine flags
.\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun -Verbose
```

### Run Scheduled Task Immediately

```powershell
Start-ScheduledTask -TaskName "CodePark-Daily-Update"

# Monitor execution
while ((Get-ScheduledTask -TaskName "CodePark-Daily-Update").State -eq 'Running') {
    Write-Host "Task is running..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
Write-Host "Task completed!" -ForegroundColor Green

# Check result
Get-ScheduledTask -TaskName "CodePark-Daily-Update" | Get-ScheduledTaskInfo
```

---

## 🔄 Rollback

### Automatic Rollback

The script automatically restores the latest backup if installation fails:

```
[2024-12-05 02:05:45] [ERROR] Installation failed: npm install failed with exit code 1
[2024-12-05 02:05:45] [WARNING] Attempting to restore from backup...
[2024-12-05 02:05:46] [SUCCESS] Restored backup: package-lock-20241205-020430.json
[2024-12-05 02:05:47] [SUCCESS] Successfully restored to previous state
```

### Manual Rollback

```powershell
# List available backups
Get-ChildItem .\backups\package-lock-*.json |
  Sort-Object LastWriteTime -Descending |
  Format-Table Name, LastWriteTime, @{L='Size';E={"$([Math]::Round($_.Length/1KB,2)) KB"}}

# Restore specific backup
Copy-Item .\backups\package-lock-20241205-020430.json .\package-lock.json -Force
npm ci  # Install exact versions from restored lock file
```

---

## 🛑 Disable Auto-Updates

### Temporary Disable

```powershell
# Disable task (keeps configuration)
Disable-ScheduledTask -TaskName "CodePark-Daily-Update"

# Re-enable later
Enable-ScheduledTask -TaskName "CodePark-Daily-Update"
```

### Permanent Removal

```powershell
# Remove scheduled task completely
Unregister-ScheduledTask -TaskName "CodePark-Daily-Update" -Confirm:$false

# Verify removal
Get-ScheduledTask -TaskName "CodePark-Daily-Update" -ErrorAction SilentlyContinue
```

---

## 🐛 Troubleshooting

### Task Not Running

1. **Check if task exists:**

   ```powershell
   Get-ScheduledTask -TaskName "CodePark-Daily-Update"
   ```

2. **Check task status:**

   ```powershell
   (Get-ScheduledTask -TaskName "CodePark-Daily-Update").State
   # Should be: Ready
   ```

3. **Check last run result:**

   ```powershell
   Get-ScheduledTaskInfo -TaskName "CodePark-Daily-Update" | Select-Object LastRunTime, LastTaskResult
   # LastTaskResult should be: 0 (success)
   ```

4. **View task history:**
   ```powershell
   Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' |
     Where-Object {$_.Message -like '*CodePark-Daily-Update*'} |
     Select-Object -First 20 | Format-Table TimeCreated, Id, Message -Wrap
   ```

### Installation Failures

1. **Check logs for errors:**

   ```powershell
   Get-Content (Get-ChildItem C:\Temp\codepark-update-*.log |
     Sort-Object LastWriteTime -Descending |
     Select-Object -First 1).FullName |
     Select-String "ERROR"
   ```

2. **Test internet connectivity:**

   ```powershell
   npm ping
   Test-NetConnection registry.npmjs.org -Port 443
   ```

3. **Test npm manually:**

   ```powershell
   cd C:\path\to\CodePark
   npm install --dry-run
   ```

4. **Check disk space:**
   ```powershell
   Get-PSDrive C | Select-Object Used, Free
   ```

### Permission Issues

1. **Check execution policy:**

   ```powershell
   Get-ExecutionPolicy -List
   ```

2. **Set RemoteSigned for current user:**

   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```

3. **Check script file permissions:**
   ```powershell
   Get-Acl .\Coding\Scripts\auto-update\update-dependencies.ps1 | Format-List
   ```

### Logs Not Created

1. **Check temp directory exists:**

   ```powershell
   Test-Path C:\Temp
   # If false, create it:
   New-Item -ItemType Directory -Path C:\Temp -Force
   ```

2. **Check write permissions:**
   ```powershell
   "test" | Out-File C:\Temp\test.txt
   Remove-Item C:\Temp\test.txt
   ```

---

## ⚙️ Advanced Configuration

### Custom Schedule Examples

```powershell
# Run every 12 hours
$Trigger1 = New-ScheduledTaskTrigger -Daily -At "2:00AM"
$Trigger2 = New-ScheduledTaskTrigger -Daily -At "2:00PM"
$Action = (Get-ScheduledTask -TaskName "CodePark-Daily-Update").Actions[0]
Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger @($Trigger1, $Trigger2)

# Run weekly on Sunday at 3 AM
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "3:00AM"
Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger $Trigger

# Run on startup (with 5-minute delay)
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Trigger.Delay = "PT5M"
Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger $Trigger
```

### Email Notifications (Windows)

Add to end of `update-dependencies.ps1`:

```powershell
# Send email notification
$MailParams = @{
    SmtpServer = "smtp.gmail.com"
    Port = 587
    UseSsl = $true
    Credential = Get-Credential
    From = "your-email@gmail.com"
    To = "your-email@gmail.com"
    Subject = "CodePark Update Completed"
    Body = "Dependencies updated at $(Get-Date). Log: $LogFile"
}
Send-MailMessage @MailParams
```

### Webhook Notifications

Add to `update-dependencies.ps1`:

```powershell
# Discord webhook
function Send-DiscordNotification {
    param([string]$Message, [string]$WebhookUrl)

    $Payload = @{
        content = $Message
        username = "CodePark Bot"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $Payload -ContentType 'application/json'
}

# Usage
Send-DiscordNotification -Message "✅ CodePark dependencies updated!" -WebhookUrl "YOUR_WEBHOOK_URL"
```

---

## 📊 What Gets Updated

| Package               | Tag    | Description                  |
| --------------------- | ------ | ---------------------------- |
| **axios**             | `next` | HTTP client (pre-release)    |
| **express**           | `next` | Web framework (experimental) |
| **mongodb**           | `next` | Database driver (beta)       |
| **nodemailer**        | `next` | Email sender (cutting-edge)  |
| **systeminformation** | `next` | System metrics (latest)      |
| **@tolgee/cli**       | `next` | i18n tooling (pre-release)   |

To see current `next` versions:

```bash
npm view axios dist-tags.next
npm view express dist-tags.next
npm view mongodb dist-tags.next
```

---

## ⚠️ Important Notes

1. **🔥 Bleeding-Edge**: You're using pre-release versions
2. **🎲 Non-Deterministic**: Different versions on each update
3. **🐛 Expect Bugs**: Pre-release = potentially unstable
4. **📚 Check Logs**: Review logs after each update
5. **💾 Backups Saved**: Last 7 days kept automatically
6. **🔄 Auto-Rollback**: Restores backup on failure
7. **🧑‍🔬 Test After Update**: Verify app works after updates
8. **🔒 Security Audit**: Check for vulnerabilities in logs
9. **🛡️ Non-Elevated**: Task runs without admin privileges
10. **⏱️ Timeout**: Max 2-hour runtime to prevent hanging

---

## 🎯 Task Configuration Summary

| Setting              | Value                          |
| -------------------- | ------------------------------ |
| **Task Name**        | CodePark-Daily-Update          |
| **Schedule**         | Daily at 2:00 AM               |
| **Run Level**        | Standard (non-elevated)        |
| **User**             | Current user                   |
| **Execution Policy** | RemoteSigned                   |
| **Max Runtime**      | 2 hours                        |
| **Restart on Fail**  | Yes (3 attempts, 10 min delay) |
| **Hidden**           | Yes (runs silently)            |
| **Network Required** | Yes                            |
| **Logs**             | C:\Temp\codepark-update-\*.log |

---

## 🔗 Quick Reference Commands

### Task Management

```powershell
# View task
Get-ScheduledTask -TaskName "CodePark-Daily-Update"

# Run now
Start-ScheduledTask -TaskName "CodePark-Daily-Update"

# Disable
Disable-ScheduledTask -TaskName "CodePark-Daily-Update"

# Enable
Enable-ScheduledTask -TaskName "CodePark-Daily-Update"

# Remove
Unregister-ScheduledTask -TaskName "CodePark-Daily-Update" -Confirm:$false
```

### Log Management

```powershell
# Latest log
Get-ChildItem C:\Temp\codepark-update-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content

# Errors only
Get-Content (Get-ChildItem C:\Temp\codepark-update-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName | Select-String "ERROR"

# Clean old logs
Get-ChildItem C:\Temp\codepark-update-*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

### Script Testing

```powershell
# Test (no changes)
.\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun

# Test with verbose
.\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun -Verbose

# Full run
.\Coding\Scripts\auto-update\update-dependencies.ps1
```

---

## 🆘 Support

- **🐛 Issues**: [github.com/skanda890/CodePark/issues](https://github.com/skanda890/CodePark/issues)
- **💬 Discussions**: [github.com/skanda890/CodePark/discussions](https://github.com/skanda890/CodePark/discussions)
- **📚 Docs**: Check logs first, then open an issue

---

## 📝 License

MIT - See [LICENSE](../../../LICENSE)

---

**Last Updated**: December 2024 | **Version**: 2.0 (Enhanced)
