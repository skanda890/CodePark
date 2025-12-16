#Requires -Version 5.0
<#
.SYNOPSIS
    Background Service Manager for CodePark JavaScript Projects
    
.DESCRIPTION
    Starts all JavaScript services in background with proper logging, process management,
    and health checks on Windows using PowerShell.
    
.PARAMETER Action
    The action to perform: start, stop, status, restart, logs, help
    
.EXAMPLE
    .\start-all-services.ps1 -Action start
    .\start-all-services.ps1 -Action status
    .\start-all-services.ps1 -Action logs
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

# Ensure we're in the correct directory
Set-Location $ScriptDir

# Port assignments
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

# Services that require npm/node
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
    Write-Host "[✓] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[⚠] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Yellow
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "[✗] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" -ForegroundColor Red
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
        Write-Error2 "Node.js is not installed or not in PATH"
        exit 1
    }
}

function Check-NpmInstalled {
    try {
        $npm = npm --version
        Write-Info "npm version: $npm"
    }
    catch {
        Write-Error2 "npm is not installed or not in PATH"
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
            Write-Error2 "Port $Port is already in use (required by $Service)"
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
        Write-Error2 "Some ports are already in use. Please free them or change port assignments."
        exit 1
    }
    Write-Success "All required ports are available"
}

function Check-ServiceDirectory {
    param([string]$Service)
    
    $serviceDir = Join-Path $ScriptDir $Service
    if (-not (Test-Path $serviceDir)) {
        Write-Warning "Service directory not found: $serviceDir"
        return $false
    }
    
    $packageJson = Join-Path $serviceDir 'package.json'
    if (-not (Test-Path $packageJson)) {
        Write-Warning "package.json not found in $Service"
        return $false
    }
    
    return $true
}

function Start-Service {
    param(
        [string]$Service,
        [int]$Port
    )
    
    Write-Info "Starting $Service on port $Port..."
    
    if (-not (Check-ServiceDirectory -Service $Service)) {
        Write-Error2 "Cannot start $Service - directory or package.json not found"
        return $false
    }
    
    $serviceDir = Join-Path $ScriptDir $Service
    $logFile = Join-Path $LogsDir "$Service.log"
    $pidFile = Join-Path $PidsDir "$Service.pid"
    
    try {
        # Create child process with proper environment
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = 'cmd.exe'
        $processInfo.Arguments = "/c cd `"$serviceDir`" && set PORT=$Port && npm start"
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.UseShellExecute = $false
        $processInfo.CreateNoWindow = $true
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        $pid = $process.Id
        
        # Store PID
        "$Service`:$pid`:$Port" | Add-Content -Path $pidFile
        $pid | Add-Content -Path $AllPidsFile
        
        # Redirect output to log file
        $process.StandardOutput | Tee-Object -FilePath $logFile -Append | Out-Null
        $process.StandardError | Tee-Object -FilePath $logFile -Append | Out-Null
        
        # Wait a moment and check if process is still running
        Start-Sleep -Seconds 2
        if ($null -eq (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
            Write-Error2 "Failed to start $Service (check $logFile for details)"
            return $false
        }
        
        Write-Success "$Service started (PID: $pid) on port $Port"
        return $true
    }
    catch {
        Write-Error2 "Error starting $Service`: $_"
        return $false
    }
}

function Start-AllServices {
    Write-Info "Starting all services in background..."
    Write-Host ""
    
    # Clear PID file
    if (Test-Path $AllPidsFile) {
        Clear-Content -Path $AllPidsFile
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
        Write-Warning "Started $startedCount services, but $($failedServices.Count) failed:"
        foreach ($service in $failedServices) {
            Write-Error2 "  - $service"
        }
        return $false
    }
}

function Display-Summary {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "🚀 SERVICES RUNNING IN BACKGROUND" -ForegroundColor Green
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
                $pid = $pidContent.Split(':')[1]
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($null -ne $process) {
                        Write-Host ("{0,-35} {1,-8} ✅ Running" -f $service, $port) -ForegroundColor Green
                    }
                    else {
                        Write-Host ("{0,-35} {1,-8} ❌ Stopped" -f $service, $port) -ForegroundColor Red
                    }
                }
                catch {
                    Write-Host ("{0,-35} {1,-8} ⚠ Error" -f $service, $port) -ForegroundColor Yellow
                }
            }
        }
        else {
            Write-Host ("{0,-35} {1,-8} ⚠ Not started" -f $service, $port) -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
    Write-Host "📋 SERVICE URLs:" -ForegroundColor Blue
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
    Write-Host "📂 Logs Location:            $LogsDir" -ForegroundColor Blue
    Write-Host "📝 PIDs Location:            $PidsDir" -ForegroundColor Blue
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Blue
}

function Stop-AllServices {
    Write-Info "Stopping all services..."
    
    if (Test-Path $AllPidsFile) {
        $pids = Get-Content -Path $AllPidsFile -ErrorAction SilentlyContinue
        $stopped = 0
        
        foreach ($pid in $pids) {
            if ($pid -match '^\d+$') {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($null -ne $process) {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Info "Stopped process $pid"
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
                $pid = $pidContent.Split(':')[1]
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($null -ne $process) {
                    Write-Success "$service (PID: $pid) - Running on port $port"
                }
                else {
                    Write-Error2 "$service - Stopped (PID file exists but process not running)"
                }
            }
        }
        else {
            Write-Warning "$service - Not started"
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
        Write-Error2 "Logs directory not found"
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
    Write-Host "    logs        Show logs directory"
    Write-Host "    help        Show this help message"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
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
        Check-AllPorts
        if (Start-AllServices) {
            Display-Summary
        }
    }
    'logs' {
        Show-Logs
    }
    'help' {
        Show-Help
    }
    default {
        Write-Error2 "Unknown command: $Action"
        Show-Help
        exit 1
    }
}
