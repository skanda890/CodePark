#!/usr/bin/env node

const { program } = require('commander');
const Scanner = require('./scanner');
const pkg = require('../package.json');

program
  .name('security-scan')
  .description('CodePark Dependency Security Scanner')
  .version(pkg.version);

program
  .command('scan [path]')
  .description('Scan project for vulnerabilities')
  .option('-html', 'Generate HTML report')
  .option('-json', 'Generate JSON report')
  .action(async (projectPath, options) => {
    const path = projectPath || process.cwd();
    const scanner = new Scanner(path);
    
    try {
      await scanner.runAudit();
      
      if (options.html || !options.json) {
        await scanner.generateHTMLReport();
      }
      
      if (options.json) {
        await scanner.generateJSONReport();
      }
      
      process.exit(0);
    } catch (err) {
      console.error('✗ Scan failed:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
