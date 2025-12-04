# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-12-04

### Fixed

- **CRITICAL**: Fixed incomplete game flow in `/game/guess` endpoint - now properly persists random number and implements full game session with `/game/check` endpoint
- **CRITICAL**: Added SIGINT handler alongside SIGTERM for graceful shutdown (handles Ctrl+C in local/dev environments)
- Centralized shutdown logic to eliminate code duplication between CLI game and signal handlers
- Refactored CLI game control flow to eliminate nested callbacks and improve readability
- Extracted CLI game logic into separate `cliGame.js` module for better separation of concerns
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

- **axios**: ^1.9.0 → ^1.7.9 (latest stable, includes security fixes and improvements)
- **mongodb**: ^6.16.0 → ^7.0.0 (major version update)
- **nodemailer**: ^7.0.3 → ^7.0.11 (latest pre-release version with bug fixes)
- Added Node.js and npm version requirements in package.json (>=18.0.0 and >=9.0.0)
- Added keywords to package.json for better discoverability
- Added test script placeholder in package.json
- Restructured index.js to properly use Express framework
- Simplified askQuestion control flow in CLI game using conditional flags
- Improved shutdown handling to work consistently across SIGTERM and SIGINT

### Added

- Health check endpoint at `/health`
- Complete API endpoints for number guessing game:
  - `GET /game/guess` - Start a new game session
  - `POST /game/check` - Check a guess against the session
- Session management with automatic expiration (10 minutes)
- Graceful shutdown handling for both SIGTERM and SIGINT signals
- Centralized `shutdown()` helper function
- New `cliGame.js` module for CLI game logic separation
- Environment variable support for PORT configuration
- Express middleware for JSON and URL-encoded request handling
- Module export for potential testing integration

### Security

- Updated axios to latest stable version (1.7.9) to patch known vulnerabilities
- Updated all GitHub Actions to latest versions for security patches
- Improved Gitleaks installation to use latest version (8.20.1)
- Added continue-on-error for security scans to prevent CI failures
- Game sessions auto-expire after 10 minutes to prevent memory leaks

## Architecture Improvements

### Code Organization

- **Separation of Concerns**: CLI game logic moved to dedicated `cliGame.js` module
- **Single Responsibility**: Each function has a clear, focused purpose
- **DRY Principle**: Eliminated duplicate shutdown code paths
- **Better Testability**: Modular structure makes unit testing easier

### Control Flow Improvements

- Replaced nested `askQuestion()` recursion with conditional continuation pattern
- Centralized shutdown logic accessible from both CLI game and signal handlers
- Consistent error handling and validation across all endpoints

### API Completeness

- Fixed broken game feature - `/game/guess` now returns gameId
- Implemented `/game/check` endpoint referenced in API hints
- Added proper session management with Map data structure
- Automatic cleanup prevents unbounded memory growth

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

# Test the guessing game API
curl http://localhost:3000/game/guess
# Copy the gameId from response, then:
curl -X POST http://localhost:3000/game/check \
  -H "Content-Type: application/json" \
  -d '{"gameId":"<your-gameId>","guess":50}'

# Run the CLI game (optional)
node index.js --game

# Test graceful shutdown with SIGTERM or SIGINT (Ctrl+C)
```

---

## Previous Versions

### [1.0.0] - Initial Release

- Basic npm project setup
- Express server integration
- Number guessing game CLI
- Security scanning workflows
- Dependency management with Dependabot
