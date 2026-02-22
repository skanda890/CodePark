const fs = require('fs');
const path = require('path');

// Pure JS semver comparison (no external deps needed)
function versionGt(v1, v2) {
  // Strip ^, ~, etc. for comparison
  v1 = v1.replace(/^[~^]/, '');
  v2 = v2.replace(/^[~^]/, '');
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return true;
    if (p1 < p2) return false;
  }
  return false;
}

function mergeDeps(packages) {
  const deps = { dependencies: {}, devDependencies: {} };
  packages.forEach(pkg => {
    ['dependencies', 'devDependencies'].forEach(type => {
      if (pkg[type]) {
        Object.entries(pkg[type]).forEach(([name, version]) => {
          const existing = deps[type][name];
          if (!existing || versionGt(version, existing)) {
            deps[type][name] = version;
          }
        });
      }
    });
  });
  return deps;
}

// Scan all subfolder package.json files
const subPkgs = [];
function scan(dir) {
  try {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(ent => {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.git') return;
        const pkgPath = path.join(full, 'package.json');
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            subPkgs.push(pkg);
            console.log(`Found: ${pkgPath}`);
          } catch (e) {
            console.warn(`Invalid JSON in ${pkgPath}`);
          }
        } else {
          scan(full);  // Recurse
        }
      }
    });
  } catch (e) {
    console.warn(`Scan error in ${dir}: ${e.message}`);
  }
}

console.log('Scanning subprojects...');
scan('.');

if (subPkgs.length === 0) {
  console.log('No subproject package.json found!');
  process.exit(1);
}

console.log(`Found ${subPkgs.length} subprojects.`);

// Load or create root package.json
let rootPkg = {
  name: 'codepark-monorepo',
  version: '1.0.0',
  private: true,
  workspaces: ['*']
};
if (fs.existsSync('package.json')) {
  rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Merging with existing root package.json');
}

// Merge deps
const merged = mergeDeps(subPkgs);
Object.assign(rootPkg, merged);

// Write back
fs.writeFileSync('package.json', JSON.stringify(rootPkg, null, 2));
console.log('✅ Root package.json updated with merged dependencies!');
console.log('Next: npm install');