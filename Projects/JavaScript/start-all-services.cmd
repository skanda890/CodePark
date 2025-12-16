@echo off
REM ################################################################################
REM Background Service Manager for CodePark JavaScript Projects
REM Windows CMD/Batch Script Version
REM ################################################################################

setlocal enabledelayedexpansion

REM Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Configuration
set LOGS_DIR=%SCRIPT_DIR%logs
set PIDS_DIR=%SCRIPT_DIR%pids
set ALL_PIDS_FILE=%PIDS_DIR%\all_pids.txt

REM Port assignments
set PORT_web-rtc-chat=3000
set PORT_code-compiler=3001
set PORT_code-quality-dashboard=3011
set PORT_ai-code-review-assistant=3002
set PORT_mobile-companion-app=3003
set PORT_github-integration=3004
set PORT_advanced-config-management=3005
set PORT_analytics-insights-engine=3006
set PORT_advanced-audit-logging=3007
set PORT_ci-cd-pipeline=3008
set PORT_webhook-system=3009
set PORT_math-calculator=4000

REM Services list
set SERVICES=web-rtc-chat code-compiler code-quality-dashboard ai-code-review-assistant mobile-companion-app github-integration advanced-config-management analytics-insights-engine advanced-audit-logging ci-cd-pipeline webhook-system math-calculator

REM Parse command line argument
set ACTION=%1
if "%ACTION%"=="" set ACTION=start

REM Main switch
if /i "%ACTION%"=="start" goto :start_services
if /i "%ACTION%"=="stop" goto :stop_services
if /i "%ACTION%"=="status" goto :show_status
if /i "%ACTION%"=="restart" goto :restart_services
if /i "%ACTION%"=="logs" goto :show_logs
if /i "%ACTION%"=="help" goto :show_help
if /i "%ACTION%"=="--help" goto :show_help
if /i "%ACTION%"=="-h" goto :show_help

echo [ERROR] Unknown command: %ACTION%
goto :show_help

REM ################################################################################
REM Start Services
REM ################################################################################
:start_services
echo.
echo ================================================================================
echo Starting CodePark JavaScript Services
echo ================================================================================
echo.

call :setup_directories
call :check_node
call :check_npm

REM Clear PID file
if exist "%ALL_PIDS_FILE%" del /q "%ALL_PIDS_FILE%"
echo. > "%ALL_PIDS_FILE%"

set STARTED_COUNT=0
set FAILED_COUNT=0

for %%s in (%SERVICES%) do (
    call :start_service %%s
    timeout /t 1 /nobreak >nul
)

echo.
echo ================================================================================
if !FAILED_COUNT! EQU 0 (
    echo [SUCCESS] All !STARTED_COUNT! services started successfully!
) else (
    echo [WARNING] Started !STARTED_COUNT! services, but !FAILED_COUNT! failed
)
echo ================================================================================
echo.

call :display_summary
goto :eof

REM ################################################################################
REM Stop Services
REM ################################################################################
:stop_services
echo.
echo [INFO] Stopping all services...
echo.

if not exist "%ALL_PIDS_FILE%" (
    echo [WARNING] No PID file found
    goto :eof
)

set STOPPED_COUNT=0
for /f "usebackq tokens=*" %%p in ("%ALL_PIDS_FILE%") do (
    if not "%%p"=="" (
        taskkill /PID %%p /F >nul 2>&1
        if !errorlevel! EQU 0 (
            echo [INFO] Stopped process %%p
            set /a STOPPED_COUNT+=1
        )
    )
)

echo.
echo [SUCCESS] Stopped !STOPPED_COUNT! processes
goto :eof

REM ################################################################################
REM Show Status
REM ################################################################################
:show_status
echo.
echo [INFO] Checking status of all services...
echo.

for %%s in (%SERVICES%) do (
    call :check_service_status %%s
)
goto :eof

REM ################################################################################
REM Restart Services
REM ################################################################################
:restart_services
call :stop_services
echo.
echo [INFO] Waiting 2 seconds before restart...
timeout /t 2 /nobreak >nul
echo.
goto :start_services

REM ################################################################################
REM Show Logs
REM ################################################################################
:show_logs
echo.
echo [INFO] Log files are located in: %LOGS_DIR%
echo.
if exist "%LOGS_DIR%" (
    dir /b "%LOGS_DIR%\*.log"
) else (
    echo [ERROR] Logs directory not found
)
goto :eof

REM ################################################################################
REM Show Help
REM ################################################################################
:show_help
echo.
echo ================================================================================
echo CodePark JavaScript Services Manager (CMD/Batch)
echo ================================================================================
echo.
echo USAGE:
echo     start-all-services.cmd [ACTION]
echo.
echo ACTIONS:
echo     start       Start all services in background (default)
echo     stop        Stop all services
echo     status      Show status of all services
echo     restart     Stop and start all services
echo     logs        Show logs directory
echo     help        Show this help message
echo.
echo EXAMPLES:
echo     start-all-services.cmd start
echo     start-all-services.cmd status
echo     start-all-services.cmd stop
echo.
echo LOG FILES:
echo     All logs are stored in: %LOGS_DIR%
echo     Each service has its own log file
echo.
echo PID FILES:
echo     Process IDs tracked in: %PIDS_DIR%
echo.
echo ================================================================================
echo.
goto :eof

REM ################################################################################
REM Helper Functions
REM ################################################################################

:setup_directories
echo [INFO] Setting up directories...
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%PIDS_DIR%" mkdir "%PIDS_DIR%"
echo [SUCCESS] Directories ready: %LOGS_DIR%, %PIDS_DIR%
exit /b 0

:check_node
node --version >nul 2>&1
if !errorlevel! NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo [INFO] Node.js version: !NODE_VERSION!
exit /b 0

:check_npm
npm --version >nul 2>&1
if !errorlevel! NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
echo [INFO] npm version: !NPM_VERSION!
exit /b 0

:start_service
set SERVICE_NAME=%1
set PORT_VAR=PORT_%SERVICE_NAME%
call set SERVICE_PORT=%%!PORT_VAR!%%

set SERVICE_DIR=%SCRIPT_DIR%%SERVICE_NAME%
set LOG_FILE=%LOGS_DIR%\%SERVICE_NAME%.log
set PID_FILE=%PIDS_DIR%\%SERVICE_NAME%.pid

echo [INFO] Starting %SERVICE_NAME% on port !SERVICE_PORT!...

if not exist "%SERVICE_DIR%" (
    echo [WARNING] Service directory not found: %SERVICE_DIR%
    set /a FAILED_COUNT+=1
    exit /b 1
)

if not exist "%SERVICE_DIR%\package.json" (
    echo [WARNING] package.json not found in %SERVICE_NAME%
    set /a FAILED_COUNT+=1
    exit /b 1
)

REM Start service in background
cd /d "%SERVICE_DIR%"
start "CodePark-%SERVICE_NAME%" /MIN cmd /c "set PORT=!SERVICE_PORT! && npm start >> "%LOG_FILE%" 2>&1"
cd /d "%SCRIPT_DIR%"

echo [SUCCESS] %SERVICE_NAME% started on port !SERVICE_PORT!
set /a STARTED_COUNT+=1
exit /b 0

:check_service_status
set SERVICE_NAME=%1
set PORT_VAR=PORT_%SERVICE_NAME%
call set SERVICE_PORT=%%!PORT_VAR!%%
set PID_FILE=%PIDS_DIR%\%SERVICE_NAME%.pid

if not exist "%PID_FILE%" (
    echo [WARNING] %SERVICE_NAME% - Not started
    exit /b 0
)

for /f "tokens=2 delims=:" %%p in ('type "%PID_FILE%"') do (
    tasklist /FI "PID eq %%p" /NH 2>nul | find "%%p" >nul
    if !errorlevel! EQU 0 (
        echo [SUCCESS] %SERVICE_NAME% (PID: %%p) - Running on port !SERVICE_PORT!
    ) else (
        echo [ERROR] %SERVICE_NAME% - Stopped (PID file exists but process not running)
    )
)
exit /b 0

:display_summary
echo.
echo ================================================================================
echo                  SERVICES RUNNING IN BACKGROUND
echo ================================================================================
echo.
echo SERVICE                             PORT     STATUS
echo -----------------------------------  -------  --------

for %%s in (%SERVICES%) do (
    set SERVICE_NAME=%%s
    set PORT_VAR=PORT_%%s
    call set SERVICE_PORT=%%!PORT_VAR!%%
    set PID_FILE=%PIDS_DIR%\%%s.pid
    
    if exist "!PID_FILE!" (
        for /f "tokens=2 delims=:" %%p in ('type "!PID_FILE!"') do (
            tasklist /FI "PID eq %%p" /NH 2>nul | find "%%p" >nul
            if !errorlevel! EQU 0 (
                echo %%s                             !SERVICE_PORT!     Running
            ) else (
                echo %%s                             !SERVICE_PORT!     Stopped
            )
        )
    ) else (
        echo %%s                             !SERVICE_PORT!     Not Started
    )
)

echo.
echo ================================================================================
echo                           SERVICE URLs
echo ================================================================================
echo.
echo   Web RTC Chat:              http://localhost:3000
echo   Code Compiler:             http://localhost:3001
echo   Code Quality Dashboard:    http://localhost:3011
echo   AI Code Review:            http://localhost:3002/review
echo   Mobile Companion:          http://localhost:3003/notify
echo   GitHub Integration:        http://localhost:3004/auth
echo   Config Management:         http://localhost:3005/config
echo   Analytics Engine:          http://localhost:3006/query
echo   Audit Logging:             http://localhost:3007/logs
echo   CI/CD Pipeline:            http://localhost:3008/status
echo   Webhook System:            http://localhost:3009/register
echo   Math Calculator:           http://localhost:4000/api/docs
echo.
echo Logs Location:                %LOGS_DIR%
echo PIDs Location:                %PIDS_DIR%
echo.
echo ================================================================================
echo.
exit /b 0
