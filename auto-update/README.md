# 🔄 Automated Daily Dependency Updater

Automatically updates CodePark dependencies to the latest bleeding-edge versions every day.

## 📋 Overview

This system:
- ✅ Runs **daily at 2:00 AM**
- ✅ Removes `package-lock.json` and `node_modules`
- ✅ Installs latest `next` versions (pre-release)
- ✅ Backs up previous `package-lock.json`
- ✅ Logs all operations
- ✅ Auto-rollback on failure
- ✅ Cleans up old backups (keeps 7 days)

---

## 🚀 Quick Start

### Linux / macOS

```bash
# Navigate to project root
cd /path/to/CodePark

# Run setup script
chmod +x auto-update/setup-cron.sh
./auto-update/setup-cron.sh
```

### Windows

```powershell
# Open PowerShell as Administrator
cd C:\path\to\CodePark

# Run setup script
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\auto-update\setup-windows-task.ps1
```

---

## 📁 File Structure

```
auto-update/
├── update-dependencies.sh      # Linux/macOS update script
├── setup-cron.sh               # Linux/macOS cron setup
├── setup-windows-task.ps1      # Windows task setup
└── README.md                   # This file

backups/                        # Created automatically
└── package-lock-*.json         # Backup files (last 7 days)
```

---

## 🔧 Configuration

### Change Update Time

**Linux/macOS (Cron):**
```bash
# Edit crontab
crontab -e

# Change time (example: 3 AM instead of 2 AM)
# Minute Hour Day Month Weekday Command
0 3 * * * cd /path/to/CodePark && /path/to/update-dependencies.sh
```

**Windows (Task Scheduler):**
```powershell
# Using Task Scheduler GUI:
# 1. Open Task Scheduler
# 2. Find "CodePark-Daily-Update"
# 3. Right-click → Properties → Triggers → Edit
# 4. Change time

# Or via PowerShell:
$Trigger = New-ScheduledTaskTrigger -Daily -At "3:00AM"
Set-ScheduledTask -TaskName "CodePark-Daily-Update" -Trigger $Trigger
```

### Change Update Frequency

**Run every 12 hours (Linux/macOS):**
```bash
crontab -e
# Add:
0 2,14 * * * cd /path/to/CodePark && /path/to/update-dependencies.sh
```

**Run twice daily (Windows):**
```powershell
# Create additional trigger
$Trigger1 = New-ScheduledTaskTrigger -Daily -At "2:00AM"
$Trigger2 = New-ScheduledTaskTrigger -Daily -At "2:00PM"
$Action = (Get-ScheduledTask -TaskName "CodePark-Daily-Update").Actions[0]
Register-ScheduledTask -TaskName "CodePark-Daily-Update" -Action $Action -Trigger @($Trigger1, $Trigger2) -Force
```

---

## 📊 Monitoring

### View Logs

**Linux/macOS:**
```bash
# View latest update log
ls -lt /tmp/codepark-update-*.log | head -n 1 | awk '{print $9}' | xargs cat

# View cron log
tail -f /tmp/codepark-cron.log

# List all logs
ls -lh /tmp/codepark-update-*.log
```

**Windows:**
```powershell
# View latest update log
Get-ChildItem C:\Temp\codepark-update-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content

# List all logs
Get-ChildItem C:\Temp\codepark-update-*.log | Sort-Object LastWriteTime -Descending
```

### Check Current Versions

```bash
# See installed versions
npm list --depth=0

# Check what 'next' currently points to
npm view axios dist-tags
npm view express dist-tags
npm view mongodb dist-tags
```

### View Backups

```bash
# List backup files
ls -lh backups/

# View specific backup
cat backups/package-lock-20241205-140000.json
```

---

## 🧪 Manual Testing

### Test Update Script

**Linux/macOS:**
```bash
cd /path/to/CodePark
./auto-update/update-dependencies.sh
```

**Windows:**
```powershell
cd C:\path\to\CodePark
.\auto-update\update-dependencies.ps1
```

### Run Scheduled Task Immediately

**Linux/macOS:**
```bash
# No direct "run now" for cron, just execute the script
./auto-update/update-dependencies.sh
```

**Windows:**
```powershell
Start-ScheduledTask -TaskName "CodePark-Daily-Update"
```

---

## 🔄 Rollback

### Manual Rollback to Backup

```bash
# List backups
ls -lh backups/

# Restore specific backup
cp backups/package-lock-20241205-140000.json package-lock.json
npm ci  # Install exact versions from restored lock file
```

### Rollback to Stable Versions

```bash
# Checkout commit with stable versions
git checkout 298b21a
npm install

# Or manually install stable
npm install axios@1.7.9 express@5.0.1 mongodb@6.17.0 nodemailer@6.9.15 systeminformation@5.23.5
```

---

## 🛑 Disable Auto-Updates

### Linux/macOS

```bash
# Remove cron job
crontab -l | grep -v 'update-dependencies.sh' | crontab -

# Verify removal
crontab -l
```

### Windows

```powershell
# Remove scheduled task
Unregister-ScheduledTask -TaskName "CodePark-Daily-Update" -Confirm:$false

# Verify removal
Get-ScheduledTask -TaskName "CodePark-Daily-Update" -ErrorAction SilentlyContinue
```

---

## 🐛 Troubleshooting

### Updates Not Running

**Check if task/cron is active:**

```bash
# Linux/macOS
crontab -l | grep update-dependencies

# Windows
Get-ScheduledTask -TaskName "CodePark-Daily-Update"
```

**Check logs for errors:**

```bash
# Linux/macOS
tail -100 /tmp/codepark-cron.log

# Windows
Get-Content C:\Temp\codepark-update-*.log -Tail 100
```

### Installation Failures

1. **Check internet connection**
2. **Verify npm registry access**: `npm ping`
3. **Check for npm errors**: Review log files
4. **Try manual update**: Run update script directly
5. **Restore backup**: Use most recent backup file

### Permission Issues

**Linux/macOS:**
```bash
# Make scripts executable
chmod +x auto-update/*.sh

# Check directory permissions
ls -la backups/
```

**Windows:**
```powershell
# Run PowerShell as Administrator
# Check execution policy
Get-ExecutionPolicy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## ⚙️ Advanced Configuration

### Email Notifications (Linux/macOS)

Add email notification to cron:

```bash
# Install mailutils
sudo apt-get install mailutils  # Ubuntu/Debian
sudo yum install mailx          # RHEL/CentOS

# Modify cron entry
crontab -e
# Add MAILTO at top:
MAILTO=your-email@example.com
0 2 * * * cd /path/to/CodePark && /path/to/update-dependencies.sh
```

### Slack/Discord Notifications

Add webhook call to update script:

```bash
# At end of update-dependencies.sh, add:
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "CodePark dependencies updated successfully!"}'
```

### Custom Backup Retention

Edit retention period in update script:

```bash
# Change from 7 days to 30 days:
find "$BACKUP_DIR" -name "package-lock-*.json" -mtime +30 -delete
```

---

## 📊 What Gets Updated

| Package | Tag | Description |
|---------|-----|-------------|
| **axios** | `next` | HTTP client (pre-release) |
| **express** | `next` | Web framework (experimental) |
| **mongodb** | `next` | Database driver (beta) |
| **nodemailer** | `next` | Email sender (cutting-edge) |
| **systeminformation** | `next` | System metrics (latest) |
| **@tolgee/cli** | `next` | i18n tooling (pre-release) |

---

## ⚠️ Important Notes

1. **🔥 Bleeding-Edge**: You're using pre-release versions
2. **🎲 Non-Deterministic**: Different versions on each update
3. **🐛 Expect Bugs**: Pre-release = more bugs
4. **📚 Check Logs**: Review logs after each update
5. **💾 Backups Saved**: Last 7 days kept automatically
6. **🔄 Auto-Rollback**: Restores backup on failure
7. **🧪 Test After Update**: Verify app works after updates

---

## 🆘 Support

**Issues?** Open an issue: https://github.com/skanda890/CodePark/issues

**Questions?** Check logs first, then open a discussion.

---

## 📝 License

MIT - See main repository LICENSE file
