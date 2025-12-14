# CodePark v1 Quick Reference

**Bookmark this page for quick access to common commands and information!**

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/skanda890/CodePark.git
cd CodePark
npm install
cp .env.example .env

# Development
npm run dev          # Start dev server
npm run dev:ai       # Start with AI/ML features
npm run graphql      # GraphQL server only

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:ai      # AI tests

# Deployment
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
npm run k8s:deploy   # Deploy to Kubernetes
```

---

## 📋 Essential Commands

### Development

| Command           | Purpose                                  | Output                        |
| ----------------- | ---------------------------------------- | ----------------------------- |
| `npm run dev`     | Start development server with hot reload | http://localhost:3000         |
| `npm run dev:ai`  | Start with AI/ML support                 | Includes TensorFlow.js        |
| `npm run graphql` | Run GraphQL server                       | http://localhost:4000/graphql |
| `npm start`       | Production start                         | Optimized build               |
| `npm run inspect` | Start with debugger                      | chrome://inspect              |

### Testing

| Command                 | Purpose                 | Coverage           |
| ----------------------- | ----------------------- | ------------------ |
| `npm test`              | All tests with coverage | 80%+               |
| `npm run test:watch`    | Watch mode              | Live updates       |
| `npm run test:ai`       | ML/AI tests             | Specific suite     |
| `npm run test:e2e`      | End-to-end tests        | User workflows     |
| `npm run test:security` | Security tests          | Vulnerability scan |

### Code Quality

| Command                  | Purpose               | Output            |
| ------------------------ | --------------------- | ----------------- |
| `npm run lint`           | Lint and fix code     | ESLint + Prettier |
| `npm run lint:check`     | Check only (no fix)   | Report only       |
| `npm run format`         | Format with Prettier  | Auto-formatted    |
| `npm run format:check`   | Check formatting      | Report only       |
| `npm run security-check` | Security audit + Snyk | Full report       |

### Database

| Command                  | Purpose               | Result         |
| ------------------------ | --------------------- | -------------- |
| `npm run migrate`        | Run migrations        | Schema updated |
| `npm run migrate:status` | Check status          | Migration list |
| `npm run seed`           | Seed with sample data | Data inserted  |
| `npm run backup`         | Backup database       | Backup created |

### Deployment

| Command                | Purpose              | Platform          |
| ---------------------- | -------------------- | ----------------- |
| `npm run docker:build` | Build Docker image   | Local registry    |
| `npm run docker:run`   | Run Docker container | Local environment |
| `npm run k8s:deploy`   | Deploy to Kubernetes | K8s cluster       |
| `npm run edge:dev`     | Develop edge workers | Local             |
| `npm run edge:deploy`  | Deploy to Cloudflare | Production        |

---

## 🔑 Environment Variables

### Critical (Required)

```bash
NODE_ENV=production              # Environment: development|staging|production
JWT_SECRET=your-32-char-secret   # JWT signing key (min 32 chars)
MONGODB_URI=mongodb://...        # Database connection
REDIS_URL=redis://...            # Redis connection
```

### Important (Strongly Recommended)

```bash
PORT=3000                        # Server port
GRAPHQL_PORT=4000               # GraphQL server port
CORS_ORIGIN=http://localhost:3000  # CORS allowed origins
JWT_EXPIRY=24h                   # Token expiration
REFRESH_TOKEN_EXPIRY=7d          # Refresh token expiration
```

### Optional (With Defaults)

```bash
LOG_LEVEL=info                   # Logging level
OPENTELEMETRY_ENABLED=true       # Distributed tracing
SENTRY_DSN=                      # Error tracking
CLOUDFLARE_API_TOKEN=            # Edge deployment
```

**👉 See `.env.example` for all variables**

---

## 📚 Documentation Links

### Core Documentation

- **README**: Main project overview → [README.md](README.md)
- **Contributing**: Contribution guidelines → [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog**: Version history → [CHANGELOG.md](CHANGELOG.md)
- **This Guide**: Quick reference → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### Technical Documentation

- **API Reference**: REST & GraphQL APIs → [docs/API.md](docs/API.md)
- **Architecture**: System design → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Deployment**: Deployment guide → [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Implementation**: Status tracker → [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

### Feature Guides

- **Auto-Updates**: Dependency updating → [Coding/Scripts/auto-update/README.md](Coding/Scripts/auto-update/README.md)
- **Auto-Update Quick Start**: Setup guide → [Coding/Scripts/auto-update/QUICKSTART.md](Coding/Scripts/auto-update/QUICKSTART.md)
- **Experimental Features**: Beta features → [docs/EXPERIMENTAL-FEATURES.md](docs/EXPERIMENTAL-FEATURES.md)
- **Security**: Security guidelines → [SECURITY.md](SECURITY.md)

---

## 🔗 Important URLs

### Development

- **Application**: http://localhost:3000
- **GraphQL Playground**: http://localhost:4000/graphql
- **API Documentation**: http://localhost:3000/api/docs
- **Metrics (Prometheus)**: http://localhost:9090
- **Debugger**: chrome://inspect

### External Services

- **GitHub Repository**: https://github.com/skanda890/CodePark
- **GitHub Issues**: https://github.com/skanda890/CodePark/issues
- **GitHub Discussions**: https://github.com/skanda890/CodePark/discussions
- **Node.js Docs**: https://nodejs.org/docs/
- **Express.js Guide**: https://expressjs.com/

---

## 🐛 Common Issues & Solutions

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Failed

```bash
# Check MongoDB
mongo --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping

# Verify connection strings
echo $MONGODB_URI
echo $REDIS_URL
```

### Tests Failing

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run with verbose output
npm test -- --verbose
```

### Out of Memory

```bash
# Increase Node memory
node --max-old-space-size=4096 index.js

# Or permanently
export NODE_OPTIONS='--max-old-space-size=4096'
npm start
```

### Git Issues

```bash
# Update fork
git remote add upstream https://github.com/skanda890/CodePark.git
git fetch upstream
git rebase upstream/main

# Reset to last commit
git reset --hard HEAD~1

# Undo changes
git checkout -- .
```

---

## 📊 System Requirements

### Minimum

- **Node.js**: 22.0.0+
- **npm**: 10.0.0+
- **RAM**: 2GB
- **Disk**: 1GB free

### Recommended (Development)

- **Node.js**: 22.11+ (latest)
- **npm**: 10.5+
- **RAM**: 4GB+
- **Disk**: 5GB+ free
- **CPU**: Multi-core processor

### Production

- **Node.js**: 22.0.0+ LTS
- **RAM**: 8GB+
- **Disk**: 20GB+ SSD
- **CPU**: 4+ cores
- **Bandwidth**: 100Mbps+

---

## 🔐 Security Checklist

- [ ] Never commit `.env` file
- [ ] Use strong JWT secret (min 32 chars)
- [ ] Enable HTTPS in production
- [ ] Run `npm audit` before deploying
- [ ] Run `npm run security-check` regularly
- [ ] Rotate API keys periodically
- [ ] Review CORS configuration
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Configure backup strategy

---

## 🚢 Deployment Checklist

### Before Deploying

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Security check passes: `npm run security-check`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrations reviewed
- [ ] Backups taken
- [ ] Monitoring configured

### Deployment Steps

1. Review changes: `git log origin/main..HEAD`
2. Update version: Edit `package.json`
3. Build: `npm run build`
4. Test: `npm test`
5. Deploy: Choose your method
   - Docker: `npm run docker:build && npm run docker:run`
   - Kubernetes: `npm run k8s:deploy`
   - Cloud: Follow platform guide
6. Verify: Test application endpoints
7. Monitor: Check logs and metrics

---

## 📞 Getting Help

### Documentation

- 📖 [Full Documentation](docs/)
- 🏗️ [Architecture Guide](docs/ARCHITECTURE.md)
- 📋 [API Documentation](docs/API.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

### Community

- 💬 [GitHub Discussions](https://github.com/skanda890/CodePark/discussions)
- 🐛 [Report Issues](https://github.com/skanda890/CodePark/issues)
- 💡 [Feature Requests](https://github.com/skanda890/CodePark/discussions)
- 🤝 [Contributing](CONTRIBUTING.md)

### Security Issues

- 🔒 Email: security@example.com (Do NOT use GitHub Issues)
- ⚠️ See [SECURITY.md](SECURITY.md) for vulnerability disclosure

---

## 💡 Pro Tips

1. **Use Git Branches**: Always create feature branches

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Pre-commit Hooks**: Set up to catch issues early

   ```bash
   npm run setup-husky
   ```

3. **Watch Tests**: Run tests continuously during development

   ```bash
   npm run test:watch
   ```

4. **Debug with Inspector**: Use Chrome DevTools

   ```bash
   npm run inspect
   # Then visit: chrome://inspect
   ```

5. **Use Environment Profiles**:

   ```bash
   # Development
   NODE_ENV=development npm run dev

   # Production
   NODE_ENV=production npm start
   ```

6. **Database Backups**: Always backup before migrations
   ```bash
   npm run backup
   npm run migrate
   ```

---

## 📱 Keyboard Shortcuts (Terminal)

| Shortcut | Action                       |
| -------- | ---------------------------- |
| `Ctrl+C` | Stop server                  |
| `Ctrl+L` | Clear screen                 |
| `Ctrl+Z` | Suspend (run `fg` to resume) |
| `↑/↓`    | Previous/next command        |
| `Ctrl+R` | Search command history       |

---

## 🎯 Common Workflows

### Creating a New Feature

```bash
# 1. Create branch
git checkout -b feature/amazing-feature

# 2. Make changes
vim src/file.js

# 3. Test
npm run test:watch
npm run lint

# 4. Commit
git add .
git commit -m "feat: Add amazing feature"

# 5. Push
git push origin feature/amazing-feature

# 6. Create PR on GitHub
```

### Fixing a Bug

```bash
# 1. Create issue if not exists
# 2. Reference in branch
git checkout -b fix/issue-123

# 3. Fix and test
vim src/file.js
npm test

# 4. Commit
git commit -m "fix: Resolve #123 - description"

# 5. Push and PR
```

### Updating Dependencies

```bash
# 1. Check outdated
npm outdated

# 2. Update specific
npm update package-name

# 3. Or update all
npm update

# 4. Test
npm test
npm run security-check

# 5. Commit
git commit -m "chore: Update dependencies"
```

---

## 📝 Version Information

| Component      | Version | Status      |
| -------------- | ------- | ----------- |
| **CodePark**   | 3.0.0   | ✅ Stable   |
| **Node.js**    | 22.0.0+ | ✅ Required |
| **npm**        | 10.0.0+ | ✅ Required |
| **TypeScript** | Latest  | ✅ Optional |
| **Docker**     | Latest  | ✅ Optional |
| **Kubernetes** | 1.24+   | ✅ Optional |

**Last Updated**: December 13, 2025  
**Maintained By**: @skanda890  
**License**: MIT
