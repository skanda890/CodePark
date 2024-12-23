const { createBackup, restoreBackup } = require('../index');
const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function captureUserData() {
    const userData = [];

    // Capture environment variables (as a JSON string)
    userData.push({ path: '.env', content: JSON.stringify(process.env, null, 2) });

    // Capture specific files/folders from the home directory
    const homeDir = os.homedir();
    const filesToCapture = ['.bashrc', '.bash_profile', '.config/git/config', '.ssh']; // Add more as needed
    filesToCapture.forEach(file => {
        const fullPath = path.join(homeDir, file);
        if (fs.existsSync(fullPath)) {
            userData.push(fullPath);
        }
    });

    // Capture specific files/folders from the current directory
    const currentDirFiles = ['./my_settings', './my_app_data.json', './another_folder'];
    currentDirFiles.forEach(file => {
        if (fs.existsSync(file)) {
            userData.push(file);
        }
    });

    return userData;
}

async function runBackup() {
    try {
        const userDataToBackup = await captureUserData();

        const response = await prompts([
            {
                type: 'text',
                name: 'backupDir',
                message: 'Enter backup directory (or press Enter for ./backups):',
                initial: './backups',
                validate: (input) => {
                    try {
                        if (!fs.existsSync(input)) {
                            fs.mkdirSync(input, { recursive: true });
                        }
                        return true;
                    } catch (error) {
                        return 'Invalid directory path.';
                    }
                }
            },
            {
                type: 'text',
                name: 'outputFilename',
                message: 'Enter backup filename (or press Enter for backup.zip):',
                initial: 'backup.zip',
            },
        ]);

        if (!response.backupDir || !response.outputFilename) {
            console.log("Backup cancelled");
            return;
        }

        const backupPath = await createBackup({
            items: userDataToBackup,
            backupDir: response.backupDir,
            outputFilename: response.outputFilename
        });

        console.log(`Backup created at: ${backupPath}`);
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

async function runRestore() {
    try {
        const response = await prompts([
            {
                type: 'text',
                name: 'archivePath',
                message: 'Enter path to backup archive:',
                validate: (input) => fs.existsSync(input) || 'Archive not found.',
            },
                        {
                type: 'text',
                name: 'restoreDir',
                message: 'Enter restore directory (or press Enter for current directory):',
                initial: '.',
                validate: (input) => {
                    try {
                        if (!fs.existsSync(input)) {
                            fs.mkdirSync(input, { recursive: true });
                        }
                        return true;
                    } catch (error) {
                        return 'Invalid directory path.';
                    }
                }
            },
            {
                type: 'confirm',
                name: 'overwrite',
                message: 'Overwrite existing files?',
                initial: false,
            },
        ]);

        if (!response.archivePath || !response.restoreDir) {
            console.log("Restore cancelled");
            return;
        }

        await restoreBackup(response.archivePath, { destination: response.restoreDir, overwrite: response.overwrite });
        console.log('Restore complete.');
    } catch (error) {
        console.error('Restore failed:', error);
    }
}

async function runBackupAndRestore() {
    const response = await prompts({
        type: 'select',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
            { title: 'Backup', value: 'backup' },
            { title: 'Restore', value: 'restore' },
        ],
    });

    if (response.action === 'backup') {
        await runBackup();
    } else if (response.action === 'restore') {
        await runRestore();
    }
}

runBackupAndRestore();
