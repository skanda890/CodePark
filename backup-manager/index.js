const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const prompts = require('prompts');

const execPromise = util.promisify(exec);

// ... (getInstalledApps function remains the same)

async function saveAppListToFile(appList) {
    try {
        const response = await prompts({
            type: 'text',
            name: 'filePath',
            message: 'Enter the path to save the app list:',
            initial: path.join(os.homedir(), 'installed_apps.txt'), // Good default
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
