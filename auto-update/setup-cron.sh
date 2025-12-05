#!/bin/bash

##############################################
# Setup Daily Cron Job for Auto-Updates
# For Linux and macOS
##############################################

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
UPDATE_SCRIPT="$PROJECT_DIR/auto-update/update-dependencies.sh"

echo "========================================"
echo "CodePark Auto-Update Cron Setup"
echo "========================================"
echo ""

# Check if update script exists
if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo "❌ Error: Update script not found at $UPDATE_SCRIPT"
    exit 1
fi

# Make update script executable
chmod +x "$UPDATE_SCRIPT"
echo "✅ Made update script executable"

# Create cron job entry (runs daily at 2 AM)
CRON_ENTRY="0 2 * * * cd $PROJECT_DIR && $UPDATE_SCRIPT >> /tmp/codepark-cron.log 2>&1"

echo ""
echo "Cron job to be added:"
echo "$CRON_ENTRY"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    read -p "Do you want to replace it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    # Remove existing entry
    crontab -l 2>/dev/null | grep -v "$UPDATE_SCRIPT" | crontab -
    echo "🗑️  Removed old cron job"
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo ""
echo "Updates will run daily at 2:00 AM"
echo "Logs will be saved to: /tmp/codepark-update-*.log"
echo "Cron logs: /tmp/codepark-cron.log"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v '$UPDATE_SCRIPT' | crontab -"
echo ""
echo "To test the update script manually:"
echo "  cd $PROJECT_DIR && ./auto-update/update-dependencies.sh"
echo ""
echo "========================================"
