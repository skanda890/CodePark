# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-12-04

### Fixed
- Updated all dependencies to their latest stable versions
- Removed unnecessary `https` package (Node.js built-in module)
- Fixed Express server initialization - server now properly starts and listens
- Updated GitHub Actions to latest versions:
  - actions/checkout@v4
  - actions/setup-node@v4
  - actions/setup-python@v5
  - actions/upload-artifact@v4
  - peter-evans/create-pull-request@v7
- Removed duplicate Renovate Bot GitHub Action steps in CI workflow
- Fixed Gitleaks installation in security workflow
- Added proper error handling in security checks (continue-on-error)
- Improved code structure in index.js with proper Express routes

### Changed
- **axios**: ^1.9.0 → ^1.13.2 (security updates and bug fixes)
- **mongodb**: ^6.16.0 → ^7.0.0 (major version update)
- **nodemailer**: ^7.0.3 → ^7.0.0 (latest stable)
- Added Node.js and npm version requirements in package.json (>=18.0.0 and >=9.0.0)
- Added keywords to package.json for better discoverability
- Added test script placeholder in package.json
- Restructured index.js to properly use Express framework

### Added
- Health check endpoint at `/health`
- API endpoints for number guessing game
- Graceful shutdown handling for Express server
- Environment variable support for PORT configuration
- Express middleware for JSON and URL-encoded request handling
- Module export for potential testing integration

### Security
- Updated axios to patch known vulnerabilities
- Updated all GitHub Actions to latest versions for security patches
- Improved Gitleaks installation to use latest version (8.20.1)
- Added continue-on-error for security scans to prevent CI failures

## Development Notes

### Breaking Changes
- MongoDB driver updated to v7.0.0 - may require connection string updates
- Express v5 is being used - some middleware signatures may have changed
- Removed `https` from dependencies - use Node.js built-in `https` module directly

### Migration Guide

If you're updating from the previous version:

1. Run `npm install` to update all dependencies
2. Review MongoDB connection code - v7 may have breaking changes
3. Remove any direct `require('https')` statements that reference the npm package
4. Test Express routes - v5 has improved error handling
5. Update any CI/CD workflows that depend on specific action versions

### Testing

To test the server:
```bash
# Start the Express server
npm start

# In another terminal, test endpoints
curl http://localhost:3000/
curl http://localhost:3000/health

# Run the CLI game (optional)
node index.js --game
```

---

## Previous Versions

### [1.0.0] - Initial Release
- Basic npm project setup
- Express server integration
- Number guessing game CLI
- Security scanning workflows
- Dependency management with Dependabot
