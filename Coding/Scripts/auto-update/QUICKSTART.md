# 🚀 Quick Start Guide: CodePark Auto-Update

## ⏱️ 5-Minute Setup

Get CodePark automatically updating to bleeding-edge dependencies in just 5 minutes!

---

## 💻 Windows Setup (Primary Method)

### Step 1: Open PowerShell as Administrator

1. Press `Win + X`
2. Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
3. Click **"Yes"** on the UAC prompt

### Step 2: Navigate to Project

```powershell
cd C:\path\to\CodePark\Coding\Scripts\auto-update
```

**Example:**
```powershell
cd C:\Users\Skanda\Projects\CodePark\Coding\Scripts\auto-update
```

### Step 3: Run Setup Script

```powershell
.\setup-windows-task.ps1
```

### Step 4: Done! ✅

The scheduled task is now active and will run daily at 2:00 AM.

---

## ⚙️ Custom Configuration (Optional)

### Change Update Time

```powershell
# Run at 3:30 AM instead of 2:00 AM
.\setup-windows-task.ps1 -Hour 3 -Minute 30
```

### Force Replace Existing Task

```powershell
# Skip confirmation prompt
.\setup-windows-task.ps1 -Force
```

### Custom Task Name

```powershell
# Use different task name
.\setup-windows-task.ps1 -TaskName "MyCustomUpdate"
```

---

## 🧑‍💻 Testing the Setup

### Test 1: Dry Run (No Changes)

Test the update script without making any changes:

```powershell
cd C:\path\to\CodePark
.\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun
```

**Expected Output:**
```
========================================
CodePark Dependency Auto-Updater
Started: 2024-12-05 18:00:00
...
DRY RUN: Would remove package-lock.json and node_modules
DRY RUN: Would run 'npm install'
========================================
```

### Test 2: Run Task Manually

Run the scheduled task immediately:

```powershell
Start-ScheduledTask -TaskName "CodePark-Daily-Update"
```

### Test 3: Check Task Status

```powershell
Get-ScheduledTask -TaskName "CodePark-Daily-Update" | Get-ScheduledTaskInfo
```

**Look for:**
- `LastRunTime`: Should show recent time
- `LastTaskResult`: Should be `0` (success)

### Test 4: View Logs

```powershell
# Find latest log
Get-ChildItem C:\Temp\codepark-update-*.log | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1 | 
  Get-Content
```

**Look for:**
```
[2024-12-05 18:00:45] [SUCCESS] Dependencies installed successfully
```

---

## 🔍 Verification Checklist

- [ ] PowerShell opened as Administrator
- [ ] Navigated to correct directory
- [ ] Setup script ran without errors
- [ ] Task appears in Task Scheduler
- [ ] Dry run test completed successfully
- [ ] Manual task run completed successfully
- [ ] Log file created in `C:\Temp`
- [ ] Backup directory created at project root

---

## 🎯 What Happens Next?

### Automatic Daily Updates

1. **2:00 AM Daily**: Task runs automatically
2. **Backup Created**: Current `package-lock.json` saved
3. **Clean Install**: Removes old files, installs latest `next` versions
4. **Security Audit**: Checks for vulnerabilities
5. **Log Created**: Detailed log saved to `C:\Temp`
6. **Auto-Rollback**: If install fails, restores backup automatically

### Where to Find Everything

| Item | Location |
|------|----------|
| **Logs** | `C:\Temp\codepark-update-*.log` |
| **Backups** | `C:\path\to\CodePark\backups\` |
| **Task** | Task Scheduler → Task Scheduler Library |
| **Script** | `C:\path\to\CodePark\Coding\Scripts\auto-update\` |

---

## 🛡️ Security & Safety

### What's Safe

✅ **Non-Elevated Execution**: Task runs without admin privileges  
✅ **RemoteSigned Policy**: Only signed remote scripts allowed  
✅ **Network Required**: Won't run without internet  
✅ **Automatic Backups**: Last 7 days kept  
✅ **Auto-Rollback**: Restores on failure  
✅ **Hidden Execution**: Runs silently in background  
✅ **Timeout Protection**: Max 2-hour runtime  

### What to Monitor

⚠️ **Check logs after first run**  
⚠️ **Review security audit results**  
⚠️ **Test app after updates**  
⚠️ **Keep backups for rollback**  

---

## 🐛 Common Issues & Fixes

### Issue: "Script cannot be loaded"

**Error:**
```
File cannot be loaded because running scripts is disabled on this system.
```

**Fix:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Issue: "Task not found"

**Error:**
```
Get-ScheduledTask : No MSFT_ScheduledTask objects found
```

**Fix:**
Re-run setup script:
```powershell
.\setup-windows-task.ps1
```

### Issue: "Access denied"

**Error:**
```
Access is denied
```

**Fix:**
Make sure PowerShell is running as Administrator

### Issue: "No logs created"

**Fix:**
Create temp directory manually:
```powershell
New-Item -ItemType Directory -Path C:\Temp -Force
```

---

## 🔧 Task Management

### View Task in Task Scheduler GUI

1. Press `Win + R`
2. Type: `taskschd.msc`
3. Press Enter
4. Navigate to: **Task Scheduler Library**
5. Find: **CodePark-Daily-Update**

### Disable Task Temporarily

```powershell
Disable-ScheduledTask -TaskName "CodePark-Daily-Update"
```

### Re-Enable Task

```powershell
Enable-ScheduledTask -TaskName "CodePark-Daily-Update"
```

### Remove Task Completely

```powershell
Unregister-ScheduledTask -TaskName "CodePark-Daily-Update" -Confirm:$false
```

---

## 📊 Monitoring Updates

### Check Installed Versions

```powershell
cd C:\path\to\CodePark
npm list --depth=0
```

### View Current 'next' Versions

```powershell
npm view axios dist-tags.next
npm view express dist-tags.next
npm view mongodb dist-tags.next
```

### Compare Versions

```powershell
# Before update
npm list --depth=0 > before.txt

# After update
npm list --depth=0 > after.txt

# Compare
Compare-Object (Get-Content before.txt) (Get-Content after.txt)
```

---

## 🔄 Manual Rollback

If you need to rollback to a previous state:

### Step 1: List Backups

```powershell
cd C:\path\to\CodePark
Get-ChildItem .\backups\package-lock-*.json | 
  Sort-Object LastWriteTime -Descending |
  Format-Table Name, LastWriteTime
```

### Step 2: Choose Backup

```powershell
# Use the backup from before the problematic update
$backup = "package-lock-20241205-020000.json"
```

### Step 3: Restore

```powershell
Copy-Item ".\backups\$backup" .\package-lock.json -Force
npm ci
```

### Step 4: Verify

```powershell
npm list --depth=0
```

---

## ❓ FAQ

### Q: Will this update my app while I'm using it?
**A:** No, it runs at 2:00 AM when you're likely not using it. Plus, you can change the time.

### Q: What if an update breaks something?
**A:** The script automatically rolls back on failure. You also have 7 days of backups.

### Q: Can I see what changed?
**A:** Yes, check the log files in `C:\Temp` for detailed information.

### Q: Will this slow down my computer?
**A:** No, it runs hidden in the background and only when network is available.

### Q: How much disk space do backups use?
**A:** Each backup is ~50KB. 7 days = ~350KB total.

### Q: Can I run this on battery power?
**A:** Yes, the task is configured to run even on battery.

### Q: Does this require admin rights?
**A:** Setup requires admin, but the task runs without elevation.

### Q: How do I know if it's working?
**A:** Check logs in `C:\Temp` or run manually with `Start-ScheduledTask`.

---

## 📞 Need Help?

1. **Check the logs**: `C:\Temp\codepark-update-*.log`
2. **Read full documentation**: [README.md](./README.md)
3. **Open an issue**: [GitHub Issues](https://github.com/skanda890/CodePark/issues)

---

## 🎉 All Done!

Your CodePark repository will now automatically stay on the bleeding edge with daily updates!

**Next Steps:**
- Monitor first few runs via logs
- Adjust schedule if needed
- Check for vulnerabilities in audit results
- Keep an eye on backups

---

**Happy Coding!** 🚀
