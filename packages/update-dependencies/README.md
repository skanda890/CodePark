# CodePark Update-Dependencies

Automated npm dependency vulnerability scanning with CVE database integration.

## Features

- ✅ npm audit integration
- ✅ CVE database queries (NVD API)
- ✅ Vulnerability severity classification
- ✅ HTML and JSON report generation
- ✅ CVSS score extraction
- ✅ Remediation recommendations
- ✅ CLI tool for manual scanning

## Installation

```bash
cd packages/update-dependencies
npm install
```

## Usage

### CLI

```bash
# Scan current directory (generates HTML report)
npm start

# Scan specific project
node src/cli.js scan /path/to/project

# Generate JSON report
node src/cli.js scan /path/to/project -json

# Generate both HTML and JSON
node src/cli.js scan /path/to/project -html -json
```

### Programmatic

```javascript
const Scanner = require('./src/scanner');

const scanner = new Scanner(process.cwd());
await scanner.runAudit();
await scanner.generateHTMLReport();
await scanner.generateJSONReport();
```

## Reports

### HTML Report

Beautiful, interactive HTML report showing:
- Vulnerability summary (critical, high, medium, low)
- Detailed vulnerability table
- CVSS scores and CVE links
- Fix availability

### JSON Report

Structured JSON data for programmatic processing:

```json
{
  "timestamp": "2025-12-06T16:00:00.000Z",
  "projectPath": "/path/to/project",
  "totalVulnerabilities": 5,
  "critical": 1,
  "high": 2,
  "medium": 2,
  "low": 0,
  "vulnerabilities": [
    {
      "package": "lodash",
      "severity": "critical",
      "range": "<4.17.21",
      "fixAvailable": "Yes",
      "cve": {
        "id": "CVE-2021-23337",
        "cvssScore": 9.8,
        "description": "Prototype pollution vulnerability",
        "publishedDate": "2021-02-01"
      }
    }
  ]
}
```

## Architecture

```
src/
├── scanner.js      # Main scanning logic
├── cli.js          # CLI interface
└── utils/
    ├── cve-fetch.js    # CVE database queries
    └── report-gen.js   # Report generation
```

## Configuration

Edit `src/scanner.js` to customize:

- CVE database URL
- Report output path
- Severity thresholds
- CVE caching behavior

## CI/CD Integration

### GitHub Actions

```yaml
- name: Security Scan
  run: |
    cd packages/update-dependencies
    npm install
    npm start
```

### GitLab CI

```yaml
security_scan:
  script:
    - cd packages/update-dependencies
    - npm install
    - npm start
```

## Future Enhancements

- [ ] Automated PR creation for patches
- [ ] Slack/Discord notifications
- [ ] GitHub issue creation
- [ ] Dependency update suggestions
- [ ] Breaking change detection
- [ ] License compliance checking

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
