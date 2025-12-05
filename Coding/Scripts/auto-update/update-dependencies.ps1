##############################################
# Automated Daily Dependency Updater (Windows)
# Enhanced version with improved error handling,
# logging, and security features
##############################################

#Requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectDir = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)),
    
    [Parameter(Mandatory=$false)]
    [string]$LogDir = "C:\Temp",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

# Initialize log file
$LogFile = Join-Path $LogDir "codepark-update-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$BackupDir = Join-Path $ProjectDir "backups"

# Create temp/log directory if it doesn't exist
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Enhanced logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'DEBUG')]
        [string]$Level = 'INFO'
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    
    # Console output with colors
    switch ($Level) {
        'SUCCESS' { Write-Host $LogMessage -ForegroundColor Green }
        'WARNING' { Write-Host $LogMessage -ForegroundColor Yellow }
        'ERROR'   { Write-Host $LogMessage -ForegroundColor Red }
        'DEBUG'   { if ($Verbose) { Write-Host $LogMessage -ForegroundColor Gray } }
        default   { Write-Host $LogMessage }
    }
    
    # File output
    Add-Content -Path $LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

# Error handling function
function Handle-Error {
    param(
        [string]$Message,
        [int]$ExitCode = 1
    )
    
    Write-Log "FATAL: $Message" -Level ERROR
    Write-Log "========================================"
    Write-Log "Update failed at $(Get-Date)"
    Write-Log "Log saved to: $LogFile"
    Write-Log "========================================"
    exit $ExitCode
}

# Backup function
function Backup-File {
    param(
        [string]$FilePath,
        [string]$BackupLocation
    )
    
    if (Test-Path $FilePath) {
        $FileName = Split-Path $FilePath -Leaf
        $BackupFile = Join-Path $BackupLocation "$FileName-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        
        try {
            Copy-Item $FilePath $BackupFile -Force
            Write-Log "Backed up $FileName" -Level SUCCESS
            return $BackupFile
        }
        catch {
            Write-Log "Failed to backup $FileName : $($_.Exception.Message)" -Level WARNING
            return $null
        }
    }
    return $null
}

# Cleanup old backups
function Cleanup-OldBackups {
    param(
        [string]$BackupLocation,
        [int]$DaysToKeep = 7
    )
    
    $CutoffDate = (Get-Date).AddDays(-$DaysToKeep)
    $DeletedCount = 0
    
    Get-ChildItem $BackupLocation -Filter "package-lock*.json" | 
        Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
        ForEach-Object {
            Remove-Item $_.FullName -Force
            $DeletedCount++
        }
    
    if ($DeletedCount -gt 0) {
        Write-Log "Cleaned up $DeletedCount old backup(s)" -Level SUCCESS
    }
}

# Restore latest backup
function Restore-LatestBackup {
    param([string]$BackupLocation)
    
    $LatestBackup = Get-ChildItem $BackupLocation -Filter "package-lock*.json" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($LatestBackup) {
        $PackageLock = Join-Path $ProjectDir "package-lock.json"
        Copy-Item $LatestBackup.FullName $PackageLock -Force
        Write-Log "Restored backup: $($LatestBackup.Name)" -Level SUCCESS
        return $true
    }
    
    Write-Log "No backup found to restore" -Level WARNING
    return $false
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." -Level DEBUG
    
    # Check if npm is available
    try {
        $npmVersion = npm --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "npm not found" }
        Write-Log "npm version: $npmVersion" -Level DEBUG
    }
    catch {
        Handle-Error "npm is not installed or not in PATH"
    }
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "node not found" }
        Write-Log "Node.js version: $nodeVersion" -Level DEBUG
    }
    catch {
        Handle-Error "Node.js is not installed or not in PATH"
    }
    
    # Check if project directory exists
    if (-not (Test-Path $ProjectDir)) {
        Handle-Error "Project directory not found: $ProjectDir"
    }
    
    # Check if package.json exists
    $PackageJson = Join-Path $ProjectDir "package.json"
    if (-not (Test-Path $PackageJson)) {
        Handle-Error "package.json not found in: $ProjectDir"
    }
    
    Write-Log "All prerequisites satisfied" -Level SUCCESS
}

# Main execution
try {
    Write-Log "========================================"
    Write-Log "CodePark Dependency Auto-Updater"
    Write-Log "Started: $(Get-Date)"
    Write-Log "Project Dir: $ProjectDir"
    Write-Log "Log File: $LogFile"
    if ($DryRun) { Write-Log "MODE: DRY RUN (no changes will be made)" -Level WARNING }
    Write-Log "========================================"
    Write-Log ""
    
    # Check prerequisites
    Test-Prerequisites
    
    # Create backup directory
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Log "Created backup directory: $BackupDir" -Level DEBUG
    }
    
    # Change to project directory
    Push-Location $ProjectDir
    Write-Log "Changed to project directory" -Level DEBUG
    
    # Backup current package-lock.json
    $PackageLock = Join-Path $ProjectDir "package-lock.json"
    $BackupPath = Backup-File -FilePath $PackageLock -BackupLocation $BackupDir
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would remove package-lock.json and node_modules" -Level WARNING
        Write-Log "DRY RUN: Would run 'npm install'" -Level WARNING
        Write-Log ""
        Write-Log "========================================"
        Write-Log "DRY RUN completed successfully"
        Write-Log "========================================"
        Pop-Location
        exit 0
    }
    
    # Remove old package-lock.json
    if (Test-Path $PackageLock) {
        Remove-Item $PackageLock -Force -ErrorAction Stop
        Write-Log "Removed old package-lock.json" -Level SUCCESS
    }
    
    # Remove node_modules
    $NodeModules = Join-Path $ProjectDir "node_modules"
    if (Test-Path $NodeModules) {
        Write-Log "Removing node_modules directory..." -Level INFO
        Remove-Item $NodeModules -Recurse -Force -ErrorAction Stop
        Write-Log "Removed node_modules directory" -Level SUCCESS
    }
    
    Write-Log ""
    Write-Log "Installing latest dependency versions..." -Level INFO
    Write-Log ""
    
    # Run npm install with output capture
    $NpmStartTime = Get-Date
    $NpmOutput = npm install 2>&1
    $NpmExitCode = $LASTEXITCODE
    $NpmDuration = (Get-Date) - $NpmStartTime
    
    # Log npm output
    $NpmOutput | ForEach-Object { 
        $line = $_.ToString()
        if ($line -match 'warn|warning') {
            Write-Log $line -Level WARNING
        }
        elseif ($line -match 'error|err') {
            Write-Log $line -Level ERROR
        }
        else {
            Write-Log $line -Level DEBUG
        }
    }
    
    if ($NpmExitCode -eq 0) {
        Write-Log ""
        Write-Log "Dependencies installed successfully in $($NpmDuration.TotalSeconds) seconds" -Level SUCCESS
        
        # Show installed versions
        Write-Log ""
        Write-Log "Installed package versions:" -Level INFO
        $ListOutput = npm list --depth=0 2>&1
        $ListOutput | ForEach-Object { Write-Log $_ -Level DEBUG }
        
        # Run security audit
        Write-Log ""
        Write-Log "Running security audit..." -Level INFO
        $AuditOutput = npm audit --json 2>&1
        
        try {
            $AuditData = $AuditOutput | ConvertFrom-Json
            $VulnCount = $AuditData.metadata.vulnerabilities
            
            if ($VulnCount.total -gt 0) {
                Write-Log "Security vulnerabilities found:" -Level WARNING
                Write-Log "  Critical: $($VulnCount.critical)" -Level $(if ($VulnCount.critical -gt 0) { 'ERROR' } else { 'INFO' })
                Write-Log "  High: $($VulnCount.high)" -Level $(if ($VulnCount.high -gt 0) { 'WARNING' } else { 'INFO' })
                Write-Log "  Moderate: $($VulnCount.moderate)" -Level INFO
                Write-Log "  Low: $($VulnCount.low)" -Level INFO
                
                if ($VulnCount.critical -gt 0 -or $VulnCount.high -gt 0) {
                    Write-Log "Consider running 'npm audit fix' to address vulnerabilities" -Level WARNING
                }
            }
            else {
                Write-Log "No security vulnerabilities found" -Level SUCCESS
            }
        }
        catch {
            Write-Log "Could not parse audit results" -Level WARNING
            $AuditOutput | ForEach-Object { Write-Log $_ -Level DEBUG }
        }
        
        # Cleanup old backups
        Cleanup-OldBackups -BackupLocation $BackupDir -DaysToKeep 7
        
        # Generate summary
        Write-Log ""
        Write-Log "========================================"
        Write-Log "Update Summary"
        Write-Log "========================================"
        Write-Log "Status: SUCCESS" -Level SUCCESS
        Write-Log "Duration: $($NpmDuration.TotalSeconds) seconds"
        Write-Log "Backup: $BackupPath"
        Write-Log "Log: $LogFile"
        Write-Log "========================================"
        
        Pop-Location
        exit 0
    }
    else {
        throw "npm install failed with exit code $NpmExitCode"
    }
}
catch {
    Write-Log ""
    Write-Log "Installation failed: $($_.Exception.Message)" -Level ERROR
    Write-Log "Exit Code: $NpmExitCode" -Level ERROR
    
    # Attempt to restore backup
    Write-Log ""
    Write-Log "Attempting to restore from backup..." -Level WARNING
    
    if (Restore-LatestBackup -BackupLocation $BackupDir) {
        Write-Log "Running npm install with restored package-lock.json..." -Level INFO
        $RestoreOutput = npm install 2>&1
        $RestoreOutput | ForEach-Object { Write-Log $_ -Level DEBUG }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Successfully restored to previous state" -Level SUCCESS
        }
        else {
            Write-Log "Failed to restore previous state" -Level ERROR
        }
    }
    
    Write-Log ""
    Write-Log "========================================"
    Write-Log "Update failed at $(Get-Date)" -Level ERROR
    Write-Log "Log saved to: $LogFile"
    Write-Log "========================================"
    
    Pop-Location
    exit 1
}
finally {
    $ProgressPreference = 'Continue'
}
