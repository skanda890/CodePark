# CodePark Monorepo Structure

## Overview

CodePark has been converted to an npm workspaces monorepo structure to improve code organization, dependency management, and scalability across multiple projects.

## New Directory Structure

```
CodePark/
├── packages/                  # Individual sub-projects
│   ├── project-1/
│   ├── project-2/
│   └── ...
├── backend/                   # Main backend services
│   ├── src/
│   ├── tests/
│   └── package.json
├── infrastructure/            # Infrastructure & DevOps
│   ├── docker/
│   ├── kubernetes/
│   └── scripts/
├── config/                    # Shared configuration
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── tsconfig.json
│   └── jest.config.js
├── docs/                      # Documentation
│   ├── MONOREPO_STRUCTURE.md
│   ├── SETUP_GUIDE.md
│   └── API_REFERENCE.md
├── middleware/                # Shared middleware
├── lib/                       # Shared libraries
├── services/                  # Shared services
├── routes/                    # API routes
├── scripts/                   # Utility scripts
├── tests/                     # Integration tests
├── node_modules/              # Root dependencies
├── package.json               # Root workspace config
├── package-lock.json
├── .github/                   # GitHub workflows
└── README.md
```

## Npm Workspaces

The root `package.json` defines workspaces:

```json
{
  "workspaces": [
    "packages/*",
    "backend",
    "infrastructure"
  ]
}
```

### Benefits

✅ **Unified Dependency Management** - Shared dependencies across all workspaces
✅ **Single node_modules** - Eliminates duplication and disk space
✅ **Cross-workspace References** - Easy inter-project dependencies
✅ **Simplified Scripts** - Run scripts across all packages with `-w` flag
✅ **Better Scalability** - Easy to add new projects to the monorepo

## Common Commands

### Installation
```bash
npm install                    # Install all workspaces
npm install -w packages/project-name  # Install specific workspace
```

### Development
```bash
npm run dev                    # Run dev mode for all packages
npm run dev -w packages/project-name  # Run specific package
```

### Building
```bash
npm run build                  # Build all packages
npm run build -w packages/project-name
```

### Testing
```bash
npm test                       # Test all packages
npm run test:e2e               # Run E2E tests
```

### Code Quality
```bash
npm run lint                   # Lint all packages
npm run lint:fix               # Fix linting issues
npm run format                 # Format code
npm run format:check           # Check formatting
```

### Security
```bash
npm run audit:security         # Audit all dependencies
```

## Workspace Package.json Structure

Each workspace should have its own `package.json` with:

```json
{
  "name": "@codepark/project-name",
  "version": "1.0.0",
  "description": "Description",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src"
  },
  "dependencies": {
    "express": "^5.0.0-beta.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "typescript": "^5.2.2"
  }
}
```

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/skanda890/CodePark.git
cd CodePark
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Add New Workspace
```bash
mkdir packages/my-new-project
cd packages/my-new-project
npm init -y
# Edit package.json with proper config
```

## Pre-release Dependencies

CodePark uses pre-release versions of key dependencies:
- `express@5.0.0-beta.1`
- `socket.io@^4.8.0`

For known compatibility issues, see `dependency-compatibility-matrix.json`

## CI/CD Integration

GitHub Actions workflows automatically:
- Run tests across all workspaces
- Lint code
- Security scanning
- Build artifacts

See `.github/workflows/` for configuration.

## Migration Guide

If migrating from single-project structure:

1. Move individual projects to `packages/`
2. Update import paths in monorepo configuration
3. Add cross-workspace dependencies in root `package.json`
4. Run `npm install` to validate
5. Test all workspaces with `npm test`

## Troubleshooting

**Issue**: Workspace not found
- **Solution**: Ensure package.json has correct "name" field

**Issue**: Duplicate dependencies
- **Solution**: Run `npm dedupe` at root level

**Issue**: Import errors between workspaces
- **Solution**: Use full package names (@codepark/project-name)

## Resources

- [NPM Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- [CodePark Contributing Guide](./CONTRIBUTING.md)
