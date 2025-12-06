# CodePark Phase 1 Implementation Setup Guide

Complete setup and development guide for Phase 1 modules.

**Date**: December 6, 2025  
**Branch**: `feature/phase-1-implementation`  
**Status**: Ready for Development

---

## Overview

Phase 1 implements 5 high-priority modules:

1. **Games Multiplayer** - Real-time multiplayer infrastructure
2. **BIOS-Info Monitor** - Windows BIOS change detection
3. **Update-Dependencies** - npm security vulnerability scanning
4. **Backup Manager** - Multi-cloud backup with encryption
5. **Code Compiler** - Multi-language code execution

**Timeline**: 14 weeks (2-3 person team)  
**Estimated Effort**: 560-840 person-hours

---

## Project Structure

```
codepark/
├── packages/
│   ├── games-multiplayer/
│   │   ├── src/
│   │   └── package.json
│   ├── bios-info/
│   │   ├── BIOSMonitor.cs
│   │   └── README.md
│   ├── update-dependencies/
│   │   ├── src/
│   │   └── package.json
│   ├─┠ backup-manager/
│   │   ├─┠ src/
│   │   └─┠ package.json
│   └── code-compiler/
│       ├── src/
│       ├── docker-compose.yml
│       └── package.json
├── package.json (workspace root)
└── PHASE_1_SETUP.md (this file)
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Docker (for Code Compiler)
- .NET SDK 7+ (for BIOS Monitor)
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/skanda890/CodePark.git
cd CodePark

# Switch to Phase 1 branch
git checkout feature/phase-1-implementation

# Install dependencies for all workspaces
npm run bootstrap

# Verify installation
npm run lint
```

---

## Module Setup

### 1. Games Multiplayer

**Technology**: Node.js + Socket.io + Redis

```bash
cd packages/games-multiplayer
cp .env.example .env
npm install
```

**Edit `.env`**:

```env
PORT=3000
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

**Start Redis**:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or locally (macOS)
brew services start redis
```

**Development**:

```bash
npm run dev   # With auto-reload
```

### 2. BIOS-Info Monitor

**Technology**: C# + .NET + WMI  
**Platform**: Windows only

```bash
cd packages/bios-info

# Build
dotnet build

# Run (requires admin)
dotnet run
```

**Output Files**:

- `bios_audit_log.json` - Change history
- `bios_baseline.json` - Baseline configuration

### 3. Update-Dependencies

**Technology**: Node.js + npm audit + CVE API

```bash
cd packages/update-dependencies
npm install

# Run security scan
npm start

# Generate reports
node src/cli.js scan . -html -json
```

**Output Files**:

- `security-report.html` - Visual report
- `security-report.json` - Machine-readable

### 4. Backup Manager

**Technology**: Node.js + AWS SDK + Encryption

```bash
cd packages/backup-manager
cp .env.example .env
npm install
```

**Edit `.env`**:

```env
AWS_ACCESS_KEY=your-key
AWS_SECRET_KEY=your-secret
AWS_BUCKET=backup-bucket
AWS_REGION=us-east-1
```

### 5. Code Compiler

**Technology**: Docker + Node.js + Dockerode

```bash
cd packages/code-compiler
npm install

# Start Docker containers
docker-compose up -d

# Pull Docker images
docker-compose pull
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# From feature/phase-1-implementation
git checkout -b feature/phase-1-<module-name>
```

### 2. Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Watch mode (if available)
npm run dev
```

### 3. Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage

# Specific test file
npm test -- src/server.test.js
```

### 4. Commit & Push

```bash
# Make changes
git add .

# Commit with conventional commits
git commit -m "feat: add feature description"

# Push to feature branch
git push origin feature/phase-1-<module-name>
```

### 5. Create Pull Request

- Target: `feature/phase-1-implementation`
- Title: `[Module] Feature Description`
- Description: Link issue, describe changes
- Request reviewers

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/phase1.yml`:

```yaml
name: Phase 1 CI/CD

on:
  push:
    branches: [feature/phase-1-*]
  pull_request:
    branches: [feature/phase-1-*]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm run bootstrap
      - run: npm run lint
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## Module Status

| Module            | Status | Tests | Docs | Ready |
| ----------------- | ------ | ----- | ---- | ----- |
| Games Multiplayer | 🔧 WIP | ❌    | ✅   | 🔴    |
| BIOS Monitor      | 🔧 WIP | ❌    | ✅   | 🔴    |
| Security Scanner  | 🔧 WIP | ❌    | ✅   | 🔴    |
| Backup Manager    | 🔧 WIP | ❌    | ✅   | 🔴    |
| Code Compiler     | 🔧 WIP | ❌    | ✅   | 🔴    |

**Legend**: ❌ = Not Done, 🔧 = In Progress, ✅ = Complete

---

## Testing Strategy

### Unit Tests

```bash
# By module
cd packages/[module]
npm test
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration
```

### Coverage Goals

- **Target**: 80%+ coverage
- **Critical paths**: 100%
- **CI/CD**: Fail on < 80%

---

## Common Issues & Solutions

### Redis Connection Refused

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Or check if already running
redis-cli ping
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
sudo newgrp docker
```

### npm Workspace Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm run bootstrap
```

### .NET SDK Not Found

```bash
# Download from https://dotnet.microsoft.com/download
dotnet --version
```

---

## Deployment

### Staging

```bash
# Build all modules
npm run build

# Deploy to staging
git push origin feature/phase-1-implementation
```

### Production

```bash
# Merge to main after approval
git checkout main
git merge feature/phase-1-implementation
git push origin main
```

---

## Resources

- [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) - Full feature roadmap
- [phase-1-implementation.md](./docs/phase-1-implementation.md) - Implementation plan
- [code-templates.md](./docs/code-templates.md) - Code examples
- [GitHub Issues](https://github.com/skanda890/CodePark/issues) - Task tracking

---

## Contact & Support

- **Lead Developer**: @skanda890
- **Repository**: https://github.com/skanda890/CodePark
- **Issues**: [GitHub Issues](https://github.com/skanda890/CodePark/issues)

---

**Last Updated**: December 6, 2025  
**Next Sync**: TBD
