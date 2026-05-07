#!/bin/bash

echo "--- Starting Daily Maintenance ---"

# 1. Update package lists
sudo apt update

# 2. Upgrade all installed packages
sudo apt upgrade -y

# 3. Remove unnecessary packages and clean cache
sudo apt autoremove -y
sudo apt autoclean

# 4. Update Snaps (Ubuntu's default app format)
sudo snap refresh

# 5. Trim the SSD (Helps Hyper-V manage virtual disk size)
sudo fstrim -av

echo "--- Maintenance Complete! ---"
