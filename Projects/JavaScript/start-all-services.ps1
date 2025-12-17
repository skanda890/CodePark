#Requires -Version 5.0
<#
.SYNOPSIS
    Background Service Manager for CodePark JavaScript Projects
    
.DESCRIPTION
    Starts all JavaScript services in background with proper logging, process management,
    and health checks on Windows using PowerShell.
    
.PARAMETER Action
    The action to perform: start, stop, status, restart, logs, install, help
    
.EXAMPLE
    .\start-all-services.ps1 -Action start
    .\start-all-services.ps1 -Action status
    .\start-all-services.ps1 -Action install
#>

param(
    [Parameter(Mandatory=$false, ValueFromRemainingArguments=$true)]
    [string]$Action = 'start'
)

################################################################################
# Configuration
################################################################################

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogsDir = Join-Path $ScriptDir 'logs'
$PidsDir = Join-Path $ScriptDir 'pids'
$AllPidsFile = Join-Path $PidsDir 'all_pids.txt'

Set-Location $ScriptDir

$Ports = @{
    'web-rtc-chat' = 3000
    'code-compiler' = 3001
    'code-quality-dashboard' = 3011
    'ai-code-review-assistant' = 3002
    'mobile-companion-app' = 3003
    'github-integration' = 3004
    'advanced-config-management' = 3005
    'analytics-insights-engine' = 3006
    'advanced-audit-logging' = 3007
    'ci-cd-pipeline' = 3008
    'webhook-system' = 3009
    'math-calculator' = 4000
}

$NodeServices = @(
    'web-rtc-chat', 'code-compiler', 'code-quality-dashboard',
    'ai-code-review-assistant', 'mobile-companion-app', 'github-integration',
    'advanced-config-management', 'analytics-insights-engine',
    'advanced-audit-logging', 'ci-cd-pipeline', 'webhook-system', 'math-calculator'
)

################################################################################
# Logging Functions
################################################################################

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "[WARNING] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Red
}

################################################################################
# Utility Functions
################################################################################

function Setup-Directories {
    Write-Info "Setting up directories..."
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    if (-not (Test-Path $PidsDir)) {
        New-Item -ItemType Directory -Path $PidsDir -Force | Out-Null
    }
    Write-Success "Directories ready: $LogsDir, $PidsDir"
}

function Check-NodeInstalled {
    try {
        $node = node --version
        Write-Info "Node.js version: $node"
    }
    catch {
        Write-ErrorMsg "Node.js is not installed or not in PATH"
        exit 1
    }
}

function Check-NpmInstalled {
    try {
        $npm = npm --version
        Write-Info "npm version: $npm"
    }
    catch {
        Write-ErrorMsg "npm is not installed or not in PATH"
        exit 1
    }
}

function Check-PortAvailable {
    param(
        [int]$Port,
        [string]$Service
    )
    
    try {
        $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-ErrorMsg "Port $Port is already in use (required by $Service)"
            return $false
        }
    }
    catch {
        # Port is available
    }
    return $true
}

function Check-AllPorts {
    Write-Info "Checking port availability..."
    $allAvailable = $true
    
    foreach ($service in $NodeServices) {
        $port = $Ports[$service]
        if (-not (Check-PortAvailable -Port $port -Service $service)) {
            $allAvailable = $false
        }
    }
    
    if (-not $allAvailable) {
        Write-ErrorMsg "Some ports are already in use. Please free them or change port assignments."
        exit 1
    }
    Write-Success "All required ports are available"
}

function Check-ServiceDirectory {
    param([string]$Service)
    
    $serviceDir = Join-Path $ScriptDir $Service
    if (-not (Test-Path $serviceDir)) {
        Write-WarningMsg "Service directory not found: $serviceDir"
        return $false
    }
    
    $packageJson = Join-Path $serviceDir 'package.json'
    if (-not (Test-Path $packageJson)) {
        Write-WarningMsg "package.json not found in $Service"
        return $false
    }
    
    return $true
}

function Install-Dependencies {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "Installing Dependencies for All Services" -ForegroundColor Green
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host ""
    
    $installedCount = 0
    $failedCount = 0
    $skippedCount = 0
    
    foreach ($service in $NodeServices) {
        if (-not (Check-ServiceDirectory -Service $service)) {
            $skippedCount++
            continue
        }
        
        $serviceDir = Join-Path $ScriptDir $service
        $nodeModules = Join-Path $serviceDir 'node_modules'
        
        if (Test-Path $nodeModules) {
            Write-Info "$service - Dependencies already installed (skipping)"
            $installedCount++
            continue
        }
        
        Write-Info "Installing dependencies for $service..."
        
        Push-Location $serviceDir
        try {
            $output = npm install 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$service - Dependencies installed successfully"
                $installedCount++
            }
            else {
                Write-ErrorMsg "$service - Failed to install dependencies"
                $failedCount++
            }
        }
        catch {
            Write-ErrorMsg "$service - Error during npm install: $_"
            $failedCount++
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Host ""
    Write-Host ("=" * 80)
    Write-Info "Installation Summary:"
    Write-Success "  Installed/Already Present: $installedCount"
    if ($failedCount -gt 0) {
        Write-ErrorMsg "  Failed: $failedCount"
    }
    if ($skippedCount -gt 0) {
        Write-WarningMsg "  Skipped (missing directory): $skippedCount"
    }
    Write-Host ("=" * 80)
    Write-Host ""
}

function Start-Service {
    param(
        [string]$Service,
        [int]$Port
    )
    
    Write-Info "Starting $Service on port $Port..."
    
    if (-not (Check-ServiceDirectory -Service $Service)) {
        Write-ErrorMsg "Cannot start $Service - directory or package.json not found"
        return $false
    }
    
    $serviceDir = Join-Path $ScriptDir $Service
    $logFile = Join-Path $LogsDir "$Service.log"
    $pidFile = Join-Path $PidsDir "$Service.pid"
    
    try {
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = 'cmd.exe'
        $processInfo.Arguments = "/c cd /d `"$serviceDir`" & set PORT=$Port & npm start >> `"$logFile`" 2>&1"
        $processInfo.WorkingDirectory = $serviceDir
        $processInfo.UseShellExecute = $true
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $processId = $process.Id
        
        "$Service`:$processId`:$Port" | Set-Content -Path $pidFile -Force
        $processId | Add-Content -Path $AllPidsFile -Force
        
        Start-Sleep -Seconds 2
        if ($null -eq (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-ErrorMsg "Failed to start $Service (check $logFile for details)"
            return $false
        }
        
        Write-Success "$Service started (PID: $processId) on port $Port"
        return $true
    }
    catch {
        Write-ErrorMsg "Error starting $Service`: $_"
        return $false
    }
}

function Start-AllServices {
    Write-Info "Starting all services in background..."
    Write-Host ""
    
    if (Test-Path $AllPidsFile) {
        Clear-Content -Path $AllPidsFile -Force
    }
    else {
        New-Item -ItemType File -Path $AllPidsFile -Force | Out-Null
    }
    
    $failedServices = @()
    $startedCount = 0
    
    foreach ($service in $NodeServices) {
        $port = $Ports[$service]
        if (Start-Service -Service $service -Port $port) {
            $startedCount++
        }
        else {
            $failedServices += $service
        }
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    Write-Host ("=" * 80)
    
    if ($failedServices.Count -eq 0) {
        Write-Success "All $startedCount services started successfully!"
        return $true
    }
    else {
        Write-WarningMsg "Started $startedCount services, but $($failedServices.Count) failed:"
        foreach ($service in $failedServices) {
            Write-ErrorMsg "  - $service"
        }
        return $false
    }
}

function Display-Summary {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "SERVICES RUNNING IN BACKGROUND" -ForegroundColor Green
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host ""
    
    Write-Host ("{0,-35} {1,-8} {2}" -f "SERVICE", "PORT", "STATUS")
    Write-Host ("{0,-35} {1,-8} {2}" -f "---", "---", "---")
    
    foreach ($service in $NodeServices) {
        $port = $Ports[$service]
        $pidFile = Join-Path $PidsDir "$service.pid"
        
        if (Test-Path $pidFile) {
            $pidContent = Get-Content -Path $pidFile -ErrorAction SilentlyContinue
            if ($pidContent) {
                $processId = $pidContent.Split(':')[1]
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($null -ne $process) {
                        Write-Host ("{0,-35} {1,-8} Running" -f $service, $port) -ForegroundColor Green
                    }
                    else {
                        Write-Host ("{0,-35} {1,-8} Stopped" -f $service, $port) -ForegroundColor Red
                    }
                }
                catch {
                    Write-Host ("{0,-35} {1,-8} Error" -f $service, $port) -ForegroundColor Yellow
                }
            }
        }
        else {
            Write-Host ("{0,-35} {1,-8} Not started" -f $service, $port) -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "SERVICE URLs:" -ForegroundColor Blue
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host ""
    Write-Host "  Web RTC Chat:              http://localhost:3000"
    Write-Host "  Code Compiler:             http://localhost:3001"
    Write-Host "  Code Quality Dashboard:    http://localhost:3011"
    Write-Host "  AI Code Review:            http://localhost:3002/review"
    Write-Host "  Mobile Companion:          http://localhost:3003/notify"
    Write-Host "  GitHub Integration:        http://localhost:3004/auth"
    Write-Host "  Config Management:         http://localhost:3005/config"
    Write-Host "  Analytics Engine:          http://localhost:3006/query"
    Write-Host "  Audit Logging:             http://localhost:3007/logs"
    Write-Host "  CI/CD Pipeline:            http://localhost:3008/status"
    Write-Host "  Webhook System:            http://localhost:3009/register"
    Write-Host "  Math Calculator:           http://localhost:4000/api/docs"
    Write-Host ""
    Write-Host "Logs Location:            $LogsDir" -ForegroundColor Blue
    Write-Host "PIDs Location:            $PidsDir" -ForegroundColor Blue
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
}

function Stop-AllServices {
    Write-Info "Stopping all services..."
    
    if (Test-Path $AllPidsFile) {
        $pids = Get-Content -Path $AllPidsFile -ErrorAction SilentlyContinue
        $stopped = 0
        
        foreach ($pidLine in $pids) {
            if ($pidLine -match '^\d+$') {
                try {
                    $process = Get-Process -Id $pidLine -ErrorAction SilentlyContinue
                    if ($null -ne $process) {
                        Stop-Process -Id $pidLine -Force -ErrorAction SilentlyContinue
                        Write-Info "Stopped process $pidLine"
                        $stopped++
                    }
                }
                catch {
                    # Process already terminated
                }
            }
        }
        Write-Success "Stopped $stopped processes"
    }
}

function Show-Status {
    Write-Info "Checking status of all services..."
    Write-Host ""
    
    foreach ($service in $NodeServices) {
        $port = $Ports[$service]
        $pidFile = Join-Path $PidsDir "$service.pid"
        
        if (Test-Path $pidFile) {
            $pidContent = Get-Content -Path $pidFile -ErrorAction SilentlyContinue
            if ($pidContent) {
                $processId = $pidContent.Split(':')[1]
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($null -ne $process) {
                    Write-Success "$service (PID: $processId) - Running on port $port"
                }
                else {
                    Write-ErrorMsg "$service - Stopped (PID file exists but process not running)"
                }
            }
        }
        else {
            Write-WarningMsg "$service - Not started"
        }
    }
}

function Show-Logs {
    Write-Info "Log files are located in: $LogsDir"
    Write-Host ""
    if (Test-Path $LogsDir) {
        Get-ChildItem -Path $LogsDir -File | Format-Table -AutoSize
    }
    else {
        Write-ErrorMsg "Logs directory not found"
    }
}

function Show-Help {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "CodePark JavaScript Services Manager" -ForegroundColor Green
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "    .\start-all-services.ps1 [ACTION]"
    Write-Host ""
    Write-Host "ACTIONS:" -ForegroundColor Yellow
    Write-Host "    start       Start all services in background (default)"
    Write-Host "    stop        Stop all services"
    Write-Host "    status      Show status of all services"
    Write-Host "    restart     Stop and start all services"
    Write-Host "    install     Install dependencies for all services"
    Write-Host "    logs        Show logs directory"
    Write-Host "    help        Show this help message"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "    .\start-all-services.ps1 install"
    Write-Host "    .\start-all-services.ps1 start"
    Write-Host "    .\start-all-services.ps1 status"
    Write-Host "    .\start-all-services.ps1 stop"
    Write-Host ""
    Write-Host "LOG FILES:" -ForegroundColor Yellow
    Write-Host "    All logs are stored in: $LogsDir"
    Write-Host "    Each service has its own log file"
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host ""
}

################################################################################
# Main Script
################################################################################

switch ($Action) {
    'start' {
        Setup-Directories
        Check-NodeInstalled
        Check-NpmInstalled
        Install-Dependencies
        Check-AllPorts
        if (Start-AllServices) {
            Display-Summary
        }
    }
    'stop' {
        Stop-AllServices
    }
    'status' {
        Show-Status
    }
    'restart' {
        Stop-AllServices
        Start-Sleep -Seconds 2
        Setup-Directories
        Install-Dependencies
        Check-AllPorts
        if (Start-AllServices) {
            Display-Summary
        }
    }
    'install' {
        Check-NodeInstalled
        Check-NpmInstalled
        Install-Dependencies
    }
    'logs' {
        Show-Logs
    }
    'help' {
        Show-Help
    }
    default {
        Write-ErrorMsg "Unknown command: $Action"
        Show-Help
        exit 1
    }
}
