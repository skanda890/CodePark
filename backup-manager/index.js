const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const prompts = require('prompts');

const execPromise = util.promisify(exec);

async function getInstalledApps() {
    // ... (This function remains the same)
}

function generateInstallCommands(appList) {
    const osType = process.platform;
    const commands = [];

    switch (osType) {
        case 'win32':
            commands.push("# Windows: Manual Installation Recommended. Use Chocolatey or winget for better automation.");
            appList.forEach(app => {
                commands.push(`# Install ${app} manually or using: choco install ${app} or winget install ${app}`);
            });
            break;
        case 'darwin':
            commands.push("# macOS: Use Homebrew if available.");
            appList.forEach(app => {
                const brewCaskName = app.toLowerCase().replace(/\s+/g, '-');
                commands.push(`brew install --cask ${brewCaskName} || brew install ${brewCaskName}`);
            });
            break;
        case 'linux':
            commands.push("# Linux (Debian/Ubuntu): Use apt.");
            appList.forEach(app => {
                commands.push(`sudo apt-get install -y ${app}`);
            });
            break;
        default:
            commands.push("# Unsupported operating system for automated installation.");
            break;
    }

    return commands;
}

async function saveAppListToFile(appList, commands) {
    try {
        const response = await prompts({
            type: 'text',
            name: 'filePath',
            message: 'Enter the path to save the app list and commands:',
            initial: path.join(os.homedir(), 'installed_apps_and_commands.txt'),
            validate: (input) => {
                if (fs.existsSync(input) && fs.statSync(input).isDirectory()) {
                    return "Please enter a file path, not a directory.";
                }
                return true;
            }
        });

        if (!response.filePath) {
            console.log("Save cancelled");
            return;
        }

        // Combine app list and commands with clear separators
        const fileContent = `Installed Applications:\n${appList.join('\n')}\n\n# Installation Commands:\n${commands.join('\n')}`;

        fs.writeFileSync(response.filePath, fileContent);
        console.log(`App list and commands saved to: ${response.filePath}`);

    } catch (error) {
        console.error('Error saving app list:', error);
    }
}

async function main() {
    try {
        const installedApps = await getInstalledApps();
        if (installedApps.length > 0) {
            const installCommands = generateInstallCommands(installedApps);
            await saveAppListToFile(installedApps, installCommands);
        } else {
            console.log("No installed apps found or an error occurred.");
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
