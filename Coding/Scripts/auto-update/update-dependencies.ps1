##############################################
# Automated Daily Dependency Updater (Windows)
##############################################

$ErrorActionPreference = "Continue"

$LogFile = "C:\Temp\codepark-update-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$ScriptDir = Split-Path -Parent $PSScriptRoot
$ProjectDir = Split-Path -Parent $ScriptDir
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
Write-Log "Project Dir: $ProjectDir"
Write-Log "========================================"

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Change to project directory
Set-Location $ProjectDir

# Backup current package-lock.json
$PackageLock = Join-Path $ProjectDir "package-lock.json"
if (Test-Path $PackageLock) {
    $BackupFile = Join-Path $BackupDir "package-lock-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    Copy-Item $PackageLock $BackupFile
    Write-Log "âœ… Backed up package-lock.json to $BackupFile"
}

# Remove old package-lock.json
if (Test-Path $PackageLock) {
    Remove-Item $PackageLock -Force
    Write-Log "ðŸ—‘ï¸ Removed old package-lock.json"
}

# Remove node_modules
$NodeModules = Join-Path $ProjectDir "node_modules"
if (Test-Path $NodeModules) {
    Write-Log "ðŸ—‘ï¸ Removing node_modules..."
    Remove-Item $NodeModules -Recurse -Force
}

Write-Log ""
Write-Log "ðŸ“¦ Installing latest 'next' versions..."
Write-Log ""

# Run npm install with proper error handling
$NpmExitCode = 0
try {
    # Capture output and exit code separately
    $NpmOutput = npm install 2>&1
    $NpmExitCode = $LASTEXITCODE
    
    $NpmOutput | ForEach-Object { Write-Log $_ }
    
    if ($NpmExitCode -eq 0) {
        Write-Log ""
        Write-Log "âœ… Dependencies updated successfully!"
        
        # Show installed versions
        Write-Log ""
        Write-Log "ðŸ“‹ Installed versions:"
        $ListOutput = npm list --depth=0 2>&1
        $ListOutput | ForEach-Object { Write-Log $_ }
        
        # Security audit
        Write-Log ""
        Write-Log "ðŸ”’ Security audit:"
        $AuditOutput = npm audit 2>&1
        $AuditOutput | ForEach-Object { Write-Log $_ }
        
        # Clean up old backups (keep last 7 days)
        Get-ChildItem $BackupDir -Filter "package-lock-*.json" | 
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
            Remove-Item -Force
        Write-Log "ðŸ§¹ Cleaned up old backups (kept last 7 days)"
    } else {
        throw "npm install failed with exit code $NpmExitCode"
    }
    
} catch {
    Write-Log ""
    Write-Log "âŒ Installation failed: $($_.Exception.Message)"
    Write-Log "Exit Code: $NpmExitCode"
    
    # Restore latest backup
    $LatestBackup = Get-ChildItem $BackupDir -Filter "package-lock-*.json" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($LatestBackup) {
        Copy-Item $LatestBackup.FullName $PackageLock
        Write-Log "ðŸ”„ Restored backup: $($LatestBackup.Name)"
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
