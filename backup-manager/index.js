const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const prompts = require('prompts');

const execPromise = util.promisify(exec);

async function getInstalledApps() {
    try {
        let apps = [];
        switch (process.platform) {
            case 'win32':
                const powershellCommand = `Get-WmiObject -Class Win32_Product | Select-Object -ExpandProperty Name`;
                const { stdout: winApps } = await execPromise(`powershell.exe -Command "${powershellCommand}"`);
                apps = winApps.trim().split('\r\n');
                break;
            case 'darwin':
                const { stdout: macApps } = await execPromise('mdfind "kMDItemKind == \'Application\'"');
                apps = macApps.trim().split('\n').map(appPath => path.basename(appPath));
                break;
            case 'linux':
                try {
                    const { stdout: linuxApps } = await execPromise('dpkg --get-selections | grep -v deinstall');
                    apps = linuxApps.trim().split('\n').map(line => line.split('\t')[0]);
                } catch (error) {
                    console.warn("Could not retrieve installed apps using dpkg. Trying with ls.")
                    const { stdout: linuxApps } = await execPromise('ls /usr/share/applications/');
                    apps = linuxApps.trim().split('\n');
                }
                break;
            default:
                console.log('Unsupported operating system for app listing.');
                return [];
        }
        return apps;
    } catch (error) {
        console.error('Error getting installed apps:', error);
        return [];
    }
}

async function saveAppListToFile(appList) {
    try {
        const response = await prompts({
            type: 'text',
            name: 'filePath',
            message: 'Enter the path to save the app list:',
            initial: path.join(os.homedir(), 'installed_apps.txt'),
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

        fs.writeFileSync(response.filePath, appList.join('\n'));
        console.log(`App list saved to: ${response.filePath}`);
    } catch (error) {
        console.error('Error saving app list:', error);
    }
}

async function main() {
    try {
        const installedApps = await getInstalledApps();
        if (installedApps.length > 0) {
            await saveAppListToFile(installedApps);
        } else {
            console.log("No installed apps found or error occurred.")
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
