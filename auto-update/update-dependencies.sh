#!/bin/bash

##############################################
# Automated Daily Dependency Updater
# Installs latest versions from 'next' tags
##############################################

set -e          # Exit on error
set -o pipefail # Fail pipeline if any command fails

# Get project root directory (parent of auto-update/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LOG_FILE="/tmp/codepark-update-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$PROJECT_DIR/backups"

echo "========================================" | tee -a "$LOG_FILE"
echo "CodePark Dependency Auto-Updater" | tee -a "$LOG_FILE"
echo "Started: $(date)" | tee -a "$LOG_FILE"
echo "Project Dir: $PROJECT_DIR" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Change to project directory
cd "$PROJECT_DIR"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current package-lock.json
if [ -f "package-lock.json" ]; then
    BACKUP_FILE="$BACKUP_DIR/package-lock-$(date +%Y%m%d-%H%M%S).json"
    cp package-lock.json "$BACKUP_FILE"
    echo "✅ Backed up package-lock.json to $BACKUP_FILE" | tee -a "$LOG_FILE"
fi

# Remove old package-lock to force fresh resolution
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "🗑️  Removed old package-lock.json" | tee -a "$LOG_FILE"
fi

# Remove node_modules to ensure clean install
if [ -d "node_modules" ]; then
    echo "🗑️  Removing node_modules..." | tee -a "$LOG_FILE"
    rm -rf node_modules
fi

echo "" | tee -a "$LOG_FILE"
echo "📦 Installing latest 'next' versions..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Install dependencies with proper error detection
# Separate npm command from tee to capture real exit code
NPM_OUTPUT=$(mktemp)
if npm install > "$NPM_OUTPUT" 2>&1; then
    # Success path
    cat "$NPM_OUTPUT" | tee -a "$LOG_FILE"
    rm -f "$NPM_OUTPUT"
    
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Dependencies updated successfully!" | tee -a "$LOG_FILE"
    
    # Show what was installed
    echo "" | tee -a "$LOG_FILE"
    echo "📋 Installed versions:" | tee -a "$LOG_FILE"
    npm list --depth=0 2>&1 | tee -a "$LOG_FILE"
    
    # Check for vulnerabilities
    echo "" | tee -a "$LOG_FILE"
    echo "🔒 Security audit:" | tee -a "$LOG_FILE"
    npm audit 2>&1 | tee -a "$LOG_FILE" || true
    
    # Clean up old backups (keep only last 7 days)
    find "$BACKUP_DIR" -name "package-lock-*.json" -mtime +7 -delete 2>/dev/null || true
    echo "🧹 Cleaned up old backups (kept last 7 days)" | tee -a "$LOG_FILE"
    
else
    # Failure path
    cat "$NPM_OUTPUT" | tee -a "$LOG_FILE"
    rm -f "$NPM_OUTPUT"
    
    echo "" | tee -a "$LOG_FILE"
    echo "❌ Installation failed!" | tee -a "$LOG_FILE"
    
    # Restore backup if available
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/package-lock-*.json 2>/dev/null | head -n 1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" package-lock.json
        echo "🔄 Restored backup: $LATEST_BACKUP" | tee -a "$LOG_FILE"
        npm install 2>&1 | tee -a "$LOG_FILE"
    fi
    
    exit 1
fi

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Completed: $(date)" | tee -a "$LOG_FILE"
echo "Log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

exit 0
