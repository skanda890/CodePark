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

        if (!overwrite) {
            try {
                const zip = new unzipper.Zip({ path: archivePath });
                zip.on('ready', () => {
                    for (const entry of zip.files) {
                        const targetPath = path.join(destination, entry.path);
                        if (fs.existsSync(targetPath)) {
                            return reject(new Error(`File already exists: ${targetPath}. Use overwrite option.`));
                        }
                    }
                    fs.createReadStream(archivePath).pipe(unzipper.Extract({ path: destination })).on('close', resolve).on('error', reject);
                });
                zip.on('error', reject);
            } catch (err) {
                reject(err);
            }
        } else {
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }
            fs.createReadStream(archivePath).pipe(unzipper.Extract({ path: destination })).on('close', resolve).on('error', reject);
        }
    });
}

module.exports = { createBackup, restoreBackup };
