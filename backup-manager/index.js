const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const path = require('path');

async function createBackup(options = {}) {
    const {
        backupDir = './backups',
        outputFilename = 'backup.zip',
        items = [],
    } = options;

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const outputFilePath = path.join(backupDir, outputFilename);
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(outputFilePath));
        output.on('error', reject);
        archive.on('error', reject);

        for (const item of items) {
            const itemPath = typeof item === 'string' ? item : item.path;
            const archiveName = typeof item === 'string' ? path.basename(item) : (item.name || path.basename(item.path));
            const resolvedPath = path.resolve(itemPath);

            if (fs.existsSync(resolvedPath)) {
                if (fs.statSync(resolvedPath).isDirectory()) {
                    archive.directory(resolvedPath, archiveName);
                } else {
                    archive.file(resolvedPath, { name: archiveName });
                }
            } else {
                console.warn(`Path not found: ${itemPath}`);
            }
        }

        archive.pipe(output);
        archive.finalize();
    });
}

async function restoreBackup(archivePath, options = {}) {
    const { destination = '.', overwrite = false } = options;

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(archivePath)) {
            return reject(new Error(`Archive not found: ${archivePath}`));
        }

        const extract = unzipper.Extract({ path: destination });
        fs.createReadStream(archivePath).pipe(extract);

        extract.on('close', async () => {
            try {
                const configPath = path.join(destination, 'my_settings', 'config.txt');
                const envPath = path.join(destination, '.env');
                if (fs.existsSync(configPath)) {
                    await mergeConfig(configPath, destination, overwrite);
                }
                if (fs.existsSync(envPath)) {
                    if (!overwrite && fs.existsSync(path.join(path.dirname(configPath), path.basename(envPath)))) {
                        throw new Error(`File already exists: ${path.join(path.dirname(configPath), path.basename(envPath))}. Use overwrite option.`);
                    }
                    fs.copyFileSync(envPath, path.join(path.dirname(configPath), path.basename(envPath)))
                    fs.rmSync(envPath)
                }
                console.log('Restore complete.');
                resolve();
            } catch (mergeError) {
                reject(mergeError);
            }
        });

        extract.on('error', reject);
    });
}

async function mergeConfig(configPath, destination, overwrite) {
    try {
        let config = {};
        if (fs.existsSync(configPath)) {
            const configFile = fs.readFileSync(configPath, 'utf-8');
            configFile.split('\n').forEach(line => {
                const [key, value] = line.split('=').map(s => s.trim());
                if (key && value) {
                    config[key] = value;
                }
            });
        }
        const envPath = path.join(destination, '.env')
        if (fs.existsSync(envPath)) {
            const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'))
            for (const key in env) {
                config[key] = env[key]
            }
        }

        const newConfigContent = Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n');

        if (!overwrite && fs.existsSync(configPath)) {
            throw new Error(`File already exists: ${configPath}. Use overwrite option.`);
        }

        fs.writeFileSync(configPath, newConfigContent);
    } catch (error) {
        throw new Error(`Error merging config: ${error.message}`);
    }
}

module.exports = { createBackup, restoreBackup };
