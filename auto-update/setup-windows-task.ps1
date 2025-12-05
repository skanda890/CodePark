##############################################
# Setup Daily Windows Task for Auto-Updates
# For Windows using Task Scheduler
##############################################

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$UpdateScript = Join-Path $ProjectDir "auto-update\update-dependencies.ps1"
$TaskName = "CodePark-Daily-Update"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CodePark Auto-Update Task Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if update script exists
if (-not (Test-Path $UpdateScript)) {
    # Create the PowerShell update script
    $UpdateScriptContent = @'
##############################################
# Automated Daily Dependency Updater (Windows)
##############################################

$ErrorActionPreference = "Continue"

$LogFile = "C:\Temp\codepark-update-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$BackupDir = Join-Path $ProjectDir "backups"

# Create temp directory if it doesn't exist
if (-not (Test-Path "C:\Temp")) {
    New-Item -ItemType Directory -Path "C:\Temp" | Out-Null
}

function Write-Log {
    param($Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "========================================"
Write-Log "CodePark Dependency Auto-Updater"
Write-Log "Started: $(Get-Date)"
Write-Log "========================================"

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Backup current package-lock.json
$PackageLock = Join-Path $ProjectDir "package-lock.json"
if (Test-Path $PackageLock) {
    $BackupFile = Join-Path $BackupDir "package-lock-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Copy-Item $PackageLock $BackupFile
    Write-Log "✅ Backed up package-lock.json to $BackupFile"
}

# Change to project directory
Set-Location $ProjectDir

# Remove old package-lock.json
if (Test-Path $PackageLock) {
    Remove-Item $PackageLock -Force
    Write-Log "🗑️ Removed old package-lock.json"
}

# Remove node_modules
$NodeModules = Join-Path $ProjectDir "node_modules"
if (Test-Path $NodeModules) {
    Write-Log "🗑️ Removing node_modules..."
    Remove-Item $NodeModules -Recurse -Force
}

Write-Log ""
Write-Log "📦 Installing latest 'next' versions..."
Write-Log ""

# Run npm install
try {
    $NpmOutput = npm install 2>&1
    $NpmOutput | ForEach-Object { Write-Log $_ }
    
    Write-Log ""
    Write-Log "✅ Dependencies updated successfully!"
    
    # Show installed versions
    Write-Log ""
    Write-Log "📋 Installed versions:"
    $ListOutput = npm list --depth=0 2>&1
    $ListOutput | ForEach-Object { Write-Log $_ }
    
    # Security audit
    Write-Log ""
    Write-Log "🔒 Security audit:"
    $AuditOutput = npm audit 2>&1
    $AuditOutput | ForEach-Object { Write-Log $_ }
    
    # Clean up old backups (keep last 7 days)
    Get-ChildItem $BackupDir -Filter "package-lock-*.json" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
        Remove-Item -Force
    Write-Log "🧹 Cleaned up old backups (kept last 7 days)"
    
} catch {
    Write-Log ""
    Write-Log "❌ Installation failed: $($_.Exception.Message)"
    
    # Restore latest backup
    $LatestBackup = Get-ChildItem $BackupDir -Filter "package-lock-*.json" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($LatestBackup) {
        Copy-Item $LatestBackup.FullName $PackageLock
        Write-Log "🔄 Restored backup: $($LatestBackup.Name)"
        npm install 2>&1 | ForEach-Object { Write-Log $_ }
    }
    
    exit 1
}

Write-Log ""
Write-Log "========================================"
Write-Log "Completed: $(Get-Date)"
Write-Log "Log saved to: $LogFile"
Write-Log "========================================"

exit 0
'@
    
    $UpdateScriptContent | Out-File -FilePath $UpdateScript -Encoding UTF8
    Write-Host "✅ Created update script" -ForegroundColor Green
}

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️ Task '$TaskName' already exists!" -ForegroundColor Yellow
    $Response = Read-Host "Do you want to replace it? (Y/N)"
    if ($Response -ne "Y" -and $Response -ne "y") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "🗑️ Removed old task" -ForegroundColor Yellow
}

# Create scheduled task action
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$UpdateScript`""

# Create trigger (daily at 2 AM)
$Trigger = New-ScheduledTaskTrigger -Daily -At 2am

# Create settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

# Register the task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Daily auto-update for CodePark dependencies to latest 'next' versions" `
    -RunLevel Highest

Write-Host ""
Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Task Name: $TaskName" -ForegroundColor Cyan
Write-Host "Schedule: Daily at 2:00 AM" -ForegroundColor Cyan
Write-Host "Logs: C:\Temp\codepark-update-*.log" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view the task:" -ForegroundColor Yellow
Write-Host "  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "To run the task manually:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "To remove the task:" -ForegroundColor Yellow
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host ""
Write-Host "To test the update script manually:" -ForegroundColor Yellow
Write-Host "  cd $ProjectDir" -ForegroundColor Gray
Write-Host "  .\auto-update\update-dependencies.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
