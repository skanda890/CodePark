##############################################
# Setup Daily Windows Task for Auto-Updates
# For Windows using Task Scheduler
# Enhanced version with better configuration
##############################################

#Requires -Version 5.1
#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$TaskName = "CodePark-Daily-Update",
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(0, 23)]
    [int]$Hour = 2,
    
    [Parameter(Mandatory=$false)]
    [ValidateRange(0, 59)]
    [int]$Minute = 0,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

# Get script locations
$ScriptDir = $PSScriptRoot
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$UpdateScript = Join-Path $ScriptDir "update-dependencies.ps1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CodePark Auto-Update Task Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
try {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
        Write-Host "   Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        exit 1
    }
}
catch {
    Write-Host "❌ Could not verify administrator privileges" -ForegroundColor Red
    exit 1
}

# Verify update script exists
if (-not (Test-Path $UpdateScript)) {
    Write-Host "❌ Update script not found: $UpdateScript" -ForegroundColor Red
    Write-Host "   Expected location: Coding/Scripts/auto-update/update-dependencies.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Update script found: $UpdateScript" -ForegroundColor Green
Write-Host "✅ Project directory: $ProjectDir" -ForegroundColor Green
Write-Host ""

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Task '$TaskName' already exists!" -ForegroundColor Yellow
    
    if (-not $Force) {
        $Response = Read-Host "Do you want to replace it? (Y/N)"
        if ($Response -ne "Y" -and $Response -ne "y") {
            Write-Host "Aborted." -ForegroundColor Yellow
            exit 0
        }
    }
    
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "🗑️  Removed old task" -ForegroundColor Yellow
    Write-Host ""
}

# Create scheduled task components
try {
    # Action: Run PowerShell with RemoteSigned policy
    # Using -WindowStyle Hidden to run silently
    $Action = New-ScheduledTaskAction `
        -Execute "PowerShell.exe" `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy RemoteSigned -File `"$UpdateScript`""
    
    # Trigger: Daily at specified time
    $Trigger = New-ScheduledTaskTrigger -Daily -At "$Hour`:$Minute"
    
    # Settings: Configure task behavior
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 10)
    
    # Principal: Run as current user (non-elevated for security)
    $Principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType S4U `
        -RunLevel Limited
    
    # Register the task
    $Task = Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Daily auto-update for CodePark dependencies to latest versions. Runs at $Hour`:$($Minute.ToString('00')) daily."
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Display task configuration
    Write-Host "Task Configuration:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  Task Name:        $TaskName" -ForegroundColor White
    Write-Host "  Schedule:         Daily at $Hour`:$($Minute.ToString('00'))" -ForegroundColor White
    Write-Host "  Run Level:        Standard (non-elevated)" -ForegroundColor White
    Write-Host "  User:             $env:USERNAME" -ForegroundColor White
    Write-Host "  Execution Policy: RemoteSigned" -ForegroundColor White
    Write-Host "  Max Runtime:      2 hours" -ForegroundColor White
    Write-Host "  Restart on Fail:  Yes (3 attempts, 10 min interval)" -ForegroundColor White
    Write-Host "  Logs:             C:\Temp\codepark-update-*.log" -ForegroundColor White
    Write-Host "  Update Script:    $UpdateScript" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    # Security notes
    Write-Host "Security Features:" -ForegroundColor Yellow
    Write-Host "  ✓ Runs without elevation (reduced attack surface)" -ForegroundColor Gray
    Write-Host "  ✓ Uses RemoteSigned policy (requires signed remote scripts)" -ForegroundColor Gray
    Write-Host "  ✓ Only runs when network is available" -ForegroundColor Gray
    Write-Host "  ✓ Hidden window (runs silently in background)" -ForegroundColor Gray
    Write-Host "  ✓ Automatic restart on failure (up to 3 times)" -ForegroundColor Gray
    Write-Host "  ✓ 2-hour timeout to prevent hanging" -ForegroundColor Gray
    Write-Host ""
    
    # Usage instructions
    Write-Host "Task Management Commands:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  View task details:" -ForegroundColor Cyan
    Write-Host "    Get-ScheduledTask -TaskName '$TaskName' | Format-List *" -ForegroundColor White
    Write-Host ""
    Write-Host "  Run task immediately:" -ForegroundColor Cyan
    Write-Host "    Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "  Disable task:" -ForegroundColor Cyan
    Write-Host "    Disable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "  Enable task:" -ForegroundColor Cyan
    Write-Host "    Enable-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "  Remove task:" -ForegroundColor Cyan
    Write-Host "    Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor White
    Write-Host ""
    Write-Host "  View task history:" -ForegroundColor Cyan
    Write-Host "    Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' |" -ForegroundColor White
    Write-Host "      Where-Object {`$_.Message -like '*$TaskName*'} | Select-Object -First 10" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    # Script usage
    Write-Host "Update Script Usage:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  Test manually:" -ForegroundColor Cyan
    Write-Host "    cd `"$ProjectDir`"" -ForegroundColor White
    Write-Host "    .\Coding\Scripts\auto-update\update-dependencies.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Dry run (no changes):" -ForegroundColor Cyan
    Write-Host "    .\Coding\Scripts\auto-update\update-dependencies.ps1 -DryRun" -ForegroundColor White
    Write-Host ""
    Write-Host "  Verbose output:" -ForegroundColor Cyan
    Write-Host "    .\Coding\Scripts\auto-update\update-dependencies.ps1 -Verbose" -ForegroundColor White
    Write-Host ""
    Write-Host "  Custom log location:" -ForegroundColor Cyan
    Write-Host "    .\Coding\Scripts\auto-update\update-dependencies.ps1 -LogDir 'C:\MyLogs'" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    # Next steps
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the update script manually (optional but recommended)" -ForegroundColor Gray
    Write-Host "  2. Check logs in C:\Temp after first run" -ForegroundColor Gray
    Write-Host "  3. Monitor task execution in Task Scheduler" -ForegroundColor Gray
    Write-Host "  4. Review backup files in: $ProjectDir\backups" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
}
catch {
    Write-Host ""
    Write-Host "❌ Failed to create scheduled task!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
