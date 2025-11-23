#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const fetch = require("node-fetch");
const semver = require("semver");
const { execSync } = require("child_process");
const { program } = require("commander");
const { glob } = require("glob"); // No need to promisify, glob now returns a Promise

program
  .name("update-deps")
  .description(
    "Update all package.json dependencies to the latest versions (including pre-release) and auto-commit & push.",
  )
  .option("-d, --dir <directory>", "Directory to scan", "B:\\CodePark")
  .parse(process.argv);

const options = program.opts();

/**
 * Preserve the original prefix (like ^ or ~) when updating versions.
 */
function formatVersion(oldVersion, newVersion) {
  const prefixMatch = oldVersion.match(/^([\^~])/);
  return prefixMatch ? `${prefixMatch[1]}${newVersion}` : newVersion;
  const workspaceMatch = oldVersion.match(/^(workspace:)/);
  const versionPart = workspaceMatch
    ? oldVersion.slice(workspaceMatch[1].length)
    : oldVersion;
  const prefixMatch = versionPart.match(/^([\^~])/);
  const prefix = `${workspaceMatch ? workspaceMatch[1] : ""}${prefixMatch ? prefixMatch[1] : ""}`;
  return `${prefix}${newVersion}`;
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
  const allVersions = Object.keys(data.versions);
  const maxVersion = semver.maxSatisfying(allVersions, "*", {
    includePrerelease: true,
  }); // Ensuring pre-releases are included
  return maxVersion;
}

/**
 * Update dependencies or devDependencies with the latest versions.
 */
async function updateDeps(deps) {
  if (!deps) return false;
  let hasUpdated = false;
  for (const dep in deps) {
    const origVersion = deps[dep];
    try {
      const latest = await getLatestVersion(dep);
      if (latest && semver.valid(latest)) {
        const oldCoerced = semver.coerce(origVersion);
        if (oldCoerced && semver.lt(oldCoerced, latest)) {
          const newVersionFormatted = formatVersion(origVersion, latest);
          console.log(
            `Updating ${dep}: ${origVersion} -> ${newVersionFormatted}`,
          );
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
 * Process a package.json file: read its content, update dependencies if needed, then write it back.
 */
async function processPackageJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const pkg = JSON.parse(content);
    let updated = false;

    const depUpdated = await updateDeps(pkg.dependencies);
    const devDepUpdated = await updateDeps(pkg.devDependencies);
    updated = depUpdated || devDepUpdated;

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
    const pattern = "**/package.json";
    const packageFiles = await glob(pattern, {
      cwd: options.dir,
      ignore: "**/node_modules/**",
      absolute: true,
    });

    if (packageFiles.length === 0) {
      console.log("No package.json files found.");
      process.exit(0);
    }

    let hasAnyUpdate = false;
    for (const file of packageFiles) {
      const updated = await processPackageJson(file);
      if (updated) {
        hasAnyUpdate = true;
      }
    }

    if (hasAnyUpdate) {
      console.log("\nRunning git commands to add, commit, and push changes...");
      try {
        execSync("git add -A", { stdio: "inherit", cwd: options.dir });
        execSync(
          'git commit -m "chore: update dependencies to latest versions"',
          {
            stdio: "inherit",
            cwd: options.dir,
          },
        );
        execSync("git push", { stdio: "inherit", cwd: options.dir });
        console.log("✓ Git commit and push completed.");
      } catch (gitErr) {
        console.error("Git commit or push failed:", gitErr.message);
      }
    } else {
      console.log("No dependency updates were applied.");
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
