#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");
const glob = promisify(require("glob"));
const fetch = require("node-fetch");
const semver = require("semver");
const { execSync } = require("child_process");
const { program } = require("commander");

program
  .name("update-deps")
  .description("Update all package.json dependencies to the latest versions (including pre-release) and auto-commit & push.")
  // The default directory is set to "B:\CodePark".
  .option("-d, --dir <directory>", "Directory to scan", "B:\\CodePark")
  .parse(process.argv);

const options = program.opts();

/**
 * Preserve the original prefix (like ^ or ~) when updating versions.
 */
function formatVersion(oldVersion, newVersion) {
  const prefixMatch = oldVersion.match(/^([\^~])/);
  return prefixMatch ? `${prefixMatch[1]}${newVersion}` : newVersion;
}

/**
 * Query the npm registry for the latest version (including pre-releases) of a package.
 */
async function getLatestVersion(pkgName) {
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
  const res = await fetch(registryUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${pkgName}: ${res.statusText}`);
  }
  const data = await res.json();
  // Extract the available version numbers from data.versions
  const allVersions = Object.keys(data.versions);
  // Find the highest version number (include pre-releases)
  const maxVersion = semver.maxSatisfying(allVersions, "*", { includePrerelease: true });
  return maxVersion;
}

/**
 * Update a dependency object (dependencies or devDependencies) with the latest version.
 */
async function updateDeps(deps) {
  if (!deps) return false;
  let hasUpdated = false;
  for (const dep in deps) {
    const origVersion = deps[dep];
    try {
      const latest = await getLatestVersion(dep);
      if (latest && semver.valid(latest)) {
        // Use semver.coerce to compare the current version with the latest one.
        const oldCoerced = semver.coerce(origVersion);
        if (oldCoerced && semver.lt(oldCoerced, latest)) {
          const newVersionFormatted = formatVersion(origVersion, latest);
          console.log(`Updating ${dep}: ${origVersion} -> ${newVersionFormatted}`);
          deps[dep] = newVersionFormatted;
          hasUpdated = true;
        }
      } else {
        console.warn(`Could not determine a valid latest version for ${dep}`);
      }
    } catch (err) {
      console.error(`Error updating ${dep}: ${err.message}`);
    }
  }
  return hasUpdated;
}

/**
 * Process a single package.json file: read its content, update its dependencies if needed, then write it back.
 */
async function processPackageJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const pkg = JSON.parse(content);
    let updated = false;

    const depUpdated = await updateDeps(pkg.dependencies);
    const devDepUpdated = await updateDeps(pkg.devDependencies);
    updated = depUpdated || devDepUpdated;

    // Write updates back to the file if any versions were updated.
    if (updated) {
      await fs.writeFile(filePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      console.log(`✓ Updated ${filePath}`);
    } else {
      console.log(`- No updates for ${filePath}`);
    }
    return updated;
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
    return false;
  }
}

(async function main() {
  try {
    // Search recursively for package.json files while ignoring those in node_modules.
    const pattern = "**/package.json";
    const packageFiles = await glob(pattern, {
      cwd: options.dir,
      ignore: "**/node_modules/**",
      absolute: true
    });

    if (packageFiles.length === 0) {
      console.log("No package.json files found.");
      process.exit(0);
    }

    let hasAnyUpdate = false;
    // Process each discovered package.json file sequentially.
    for (const file of packageFiles) {
      const updated = await processPackageJson(file);
      if (updated) {
        hasAnyUpdate = true;
      }
    }

    // If updates were made, automatically commit and push the changes via Git.
    if (hasAnyUpdate) {
      console.log("\nRunning git commands to add, commit, and push changes...");
      try {
        // Stage all changes.
        execSync("git add -A", { stdio: "inherit", cwd: options.dir });
        // Commit the changes.
        execSync('git commit -m "chore: update dependencies to latest versions"', {
          stdio: "inherit",
          cwd: options.dir
        });
        // Push to the current branch.
        execSync("git push", { stdio: "inherit", cwd: options.dir });
        console.log("✓ Git commit and push completed.");
      } catch (gitErr) {
        console.error("Git commit or push failed (perhaps there were no changes to commit):", gitErr.message);
      }
    } else {
      console.log("No dependency updates were applied.");
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
