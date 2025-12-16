#!/bin/bash

################################################################################
# Background Service Manager for CodePark JavaScript Projects
# Starts all services in background with proper logging, process management,
# and health checks
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="${SCRIPT_DIR}/logs"
PID_DIR="${SCRIPT_DIR}/pids"
LOCKFILE="${PID_DIR}/services.lock"
ALL_PIDS_FILE="${PID_DIR}/all_pids.txt"

# Port assignments
declare -A PORTS=(
    ["web-rtc-chat"]=3000
    ["code-compiler"]=3001
    ["code-quality-dashboard"]=3011
    ["ai-code-review-assistant"]=3002
    ["mobile-companion-app"]=3003
    ["github-integration"]=3004
    ["advanced-config-management"]=3005
    ["analytics-insights-engine"]=3006
    ["advanced-audit-logging"]=3007
    ["ci-cd-pipeline"]=3008
    ["webhook-system"]=3009
    ["math-calculator"]=4000
)

# Services that require npm/node (HTTP services)
NODE_SERVICES=("web-rtc-chat" "code-compiler" "code-quality-dashboard" \
    "ai-code-review-assistant" "mobile-companion-app" "github-integration" \
    "advanced-config-management" "analytics-insights-engine" \
    "advanced-audit-logging" "ci-cd-pipeline" "webhook-system" "math-calculator")

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

setup_directories() {
    log_info "Setting up directories..."
    mkdir -p "$LOGS_DIR"
    mkdir -p "$PID_DIR"
    log_success "Directories ready: $LOGS_DIR, $PID_DIR"
}

check_node_installed() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
}

check_npm_installed() {
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    NPM_VERSION=$(npm --version)
    log_info "npm version: $NPM_VERSION"
}

check_port_available() {
    local port=$1
    local service=$2
    
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_error "Port $port is already in use (required by $service)"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_error "Port $port is already in use (required by $service)"
            return 1
        fi
    fi
    return 0
}

check_all_ports() {
    log_info "Checking port availability..."
    local all_available=true
    
    for service in "${NODE_SERVICES[@]}"; do
        port=${PORTS[$service]}
        if ! check_port_available $port $service; then
            all_available=false
        fi
    done
    
    if [ "$all_available" = false ]; then
        log_error "Some ports are already in use. Please free them or change port assignments."
        exit 1
    fi
    log_success "All required ports are available"
}

check_service_directory() {
    local service=$1
    
    if [ ! -d "$SCRIPT_DIR/$service" ]; then
        log_warning "Service directory not found: $SCRIPT_DIR/$service"
        return 1
    fi
    
    if [ ! -f "$SCRIPT_DIR/$service/package.json" ]; then
        log_warning "package.json not found in $service"
        return 1
    fi
    
    return 0
}

install_dependencies() {
    local service=$1
    log_info "Installing dependencies for $service..."
    
    if [ -f "$SCRIPT_DIR/$service/package-lock.json" ] || [ -f "$SCRIPT_DIR/$service/yarn.lock" ]; then
        log_info "Cached dependencies found, skipping npm install"
        return 0
    fi
    
    cd "$SCRIPT_DIR/$service"
    npm install --silent 2>&1 | tee -a "$LOGS_DIR/$service-install.log" > /dev/null
    cd - > /dev/null
    log_success "Dependencies installed for $service"
}

start_service() {
    local service=$1
    local port=${PORTS[$service]}
    local log_file="$LOGS_DIR/$service.log"
    
    log_info "Starting $service on port $port..."
    
    if ! check_service_directory "$service"; then
        log_error "Cannot start $service - directory or package.json not found"
        return 1
    fi
    
    # Start service in background
    cd "$SCRIPT_DIR/$service"
    PORT=$port npm start >> "$log_file" 2>&1 &
    local pid=$!
    cd - > /dev/null
    
    # Store PID
    echo "$pid" >> "$ALL_PIDS_FILE"
    echo "$service:$pid:$port" >> "$PID_DIR/$service.pid"
    
    # Wait a moment and check if process is still running
    sleep 2
    if ! kill -0 $pid 2>/dev/null; then
        log_error "Failed to start $service (check $log_file for details)"
        return 1
    fi
    
    log_success "$service started (PID: $pid) on port $port"
    return 0
}

wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null || \
           curl -s http://localhost:$port/health > /dev/null 2>&1 || \
           curl -s http://localhost:$port > /dev/null 2>&1; then
            log_success "$service is ready"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo ""
    log_warning "$service took longer to start, continuing anyway..."
    return 0
}

start_all_services() {
    log_info "Starting all services in background..."
    echo ""
    
    > "$ALL_PIDS_FILE"  # Clear PID file
    
    local failed_services=()
    local started_count=0
    
    for service in "${NODE_SERVICES[@]}"; do
        if start_service "$service"; then
            ((started_count++))
            wait_for_service "$service" ${PORTS[$service]}
        else
            failed_services+=("$service")
        fi
        sleep 1
    done
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "All $started_count services started successfully!"
        return 0
    else
        log_warning "Started $started_count services, but ${#failed_services[@]} failed:"
        for service in "${failed_services[@]}"; do
            log_error "  - $service"
        done
        return 1
    fi
}

display_summary() {
    echo ""
    echo "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🚀 SERVICES RUNNING IN BACKGROUND${NC}"
    echo "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    printf "%-35s %-8s %s\n" "SERVICE" "PORT" "STATUS"
    printf "%-35s %-8s %s\n" "---" "---" "---"
    
    for service in "${NODE_SERVICES[@]}"; do
        port=${PORTS[$service]}
        pid_file="$PID_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            pid=$(cut -d: -f2 "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                printf "${GREEN}%-35s %-8s ✅ Running${NC}\n" "$service" "$port"
            else
                printf "${RED}%-35s %-8s ❌ Stopped${NC}\n" "$service" "$port"
            fi
        else
            printf "${YELLOW}%-35s %-8s ⚠ Not started${NC}\n" "$service" "$port"
        fi
    done
    
    echo ""
    echo "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📋 SERVICE URLs:${NC}"
    echo "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Web RTC Chat:              http://localhost:3000"
    echo "  Code Compiler:             http://localhost:3001"
    echo "  Code Quality Dashboard:    http://localhost:3011"
    echo "  AI Code Review:            http://localhost:3002/review"
    echo "  Mobile Companion:          http://localhost:3003/notify"
    echo "  GitHub Integration:        http://localhost:3004/auth"
    echo "  Config Management:         http://localhost:3005/config"
    echo "  Analytics Engine:          http://localhost:3006/query"
    echo "  Audit Logging:             http://localhost:3007/logs"
    echo "  CI/CD Pipeline:            http://localhost:3008/status"
    echo "  Webhook System:            http://localhost:3009/register"
    echo "  Math Calculator:           http://localhost:4000/api/docs"
    echo ""
    echo "${BLUE}📂 Logs Location:          $LOGS_DIR${NC}"
    echo "${BLUE}📝 PIDs Location:          $PID_DIR${NC}"
    echo ""
    echo "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
}

stop_all_services() {
    log_info "Stopping all services..."
    
    if [ -f "$ALL_PIDS_FILE" ]; then
        local stopped=0
        while IFS= read -r pid; do
            if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
                kill $pid 2>/dev/null || true
                ((stopped++))
                log_info "Stopped process $pid"
            fi
        done < "$ALL_PIDS_FILE"
        log_success "Stopped $stopped processes"
    fi
}

status_all_services() {
    log_info "Checking status of all services..."
    echo ""
    
    for service in "${NODE_SERVICES[@]}"; do
        port=${PORTS[$service]}
        pid_file="$PID_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            pid=$(cut -d: -f2 "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                log_success "$service (PID: $pid) - Running on port $port"
            else
                log_error "$service - Stopped (PID file exists but process not running)"
            fi
        else
            log_warning "$service - Not started"
        fi
    done
}

show_logs() {
    local service=$1
    local log_file="$LOGS_DIR/$service.log"
    
    if [ -f "$log_file" ]; then
        log_info "Showing logs for $service (last 50 lines):"
        echo ""
        tail -50 "$log_file"
    else
        log_error "Log file not found: $log_file"
    fi
}

show_help() {
    cat << EOF
${BLUE}═══════════════════════════════════════════════════════════════════${NC}
${GREEN}CodePark JavaScript Services Manager${NC}
${BLUE}═══════════════════════════════════════════════════════════════════${NC}

${YELLOW}USAGE:${NC}
    $0 [COMMAND]

${YELLOW}COMMANDS:${NC}
    start       Start all services in background (default)
    stop        Stop all services
    status      Show status of all services
    restart     Stop and start all services
    logs        Show logs directory
    logs:SERVICE Show logs for specific service (e.g., logs:code-compiler)
    help        Show this help message

${YELLOW}EXAMPLES:${NC}
    # Start all services in background
    $0 start

    # Check status
    $0 status

    # View logs for code-compiler
    $0 logs:code-compiler

    # Stop all services
    $0 stop

${YELLOW}LOG FILES:${NC}
    All logs are stored in: $LOGS_DIR
    Each service has its own log file: $LOGS_DIR/[service-name].log

${YELLOW}PID FILES:${NC}
    Process IDs are stored in: $PID_DIR
    All PIDs tracked in: $ALL_PIDS_FILE

${BLUE}═══════════════════════════════════════════════════════════════════${NC}
EOF
}

################################################################################
# Main Script
################################################################################

main() {
    local command=${1:-start}
    
    case "$command" in
        start)
            setup_directories
            check_node_installed
            check_npm_installed
            check_all_ports
            start_all_services
            display_summary
            ;;
        stop)
            stop_all_services
            ;;
        status)
            status_all_services
            ;;
        restart)
            stop_all_services
            sleep 2
            setup_directories
            check_all_ports
            start_all_services
            display_summary
            ;;
        logs)
            log_info "Log files are in: $LOGS_DIR"
            ls -lh "$LOGS_DIR" 2>/dev/null || log_error "No logs directory found"
            ;;
        logs:*)
            service=${command#logs:}
            show_logs "$service"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Trap signals for graceful shutdown
trap 'log_info "Interrupt signal received, stopping services..."; stop_all_services; exit 0' INT TERM

main "$@"
