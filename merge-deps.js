const fs = require('fs');
const path = require('path');
const semver = require('semver');

function mergeDeps(packages) {
  const deps = { dependencies: {}, devDependencies: {} };
  packages.forEach(pkg => {
    ['dependencies', 'devDependencies'].forEach(type => {
      if (pkg[type]) {
        Object.entries(pkg[type]).forEach(([name, version]) => {
          if (!deps[type][name] || semver.gt(version, deps[type][name])) {
            deps[type][name] = version;
          }
        });
      }
    });
  });
  return deps;
}

const subPkgs = [];
function scan(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(ent => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory() && !['node_modules', '.git'].includes(ent.name)) {
      if (fs.existsSync(path.join(full, 'package.json'))) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(full, 'package.json'), 'utf8'));
          subPkgs.push(pkg);
        } catch {}
      } else {
        scan(full);
      }
    }
  });
}
scan('.');

let rootPkg = { name: 'codepark-monorepo', version: '1.0.0', private: true, workspaces: ['*'] };
if (fs.existsSync('package.json')) {
  rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
}

const merged = mergeDeps(subPkgs);
Object.assign(rootPkg, merged);

fs.writeFileSync('package.json', JSON.stringify(rootPkg, null, 2));
console.log('Root package.json updated with merged deps!');