# Security Policy

## ⚠️ Experimental Warning

This project intentionally uses **bleeding-edge experimental** versions of dependencies (marked with `next` or `latest` tags). While this provides access to cutting-edge features, it also introduces potential security risks.

## Supported Versions

| Version | Support Status | Node.js Requirement |
| ------- | -------------- | ------------------- |
| 2.0.x   | ✅ Active      | ≥22.0.0             |
| 1.0.x   | ❌ Unsupported | ≥18.0.0             |

## Security Measures Implemented

### 🛡️ Application Security

#### Security Middleware (`middleware/security.js`)

- **Helmet.js**: Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Distributed Rate Limiting**: Redis-backed rate limiting for different endpoint types
  - API endpoints: 100 requests/15min
  - Authentication: 5 attempts/15min
  - GraphQL: 50 requests/15min
  - WebSocket: 10 connections/min
- **Input Validation**: express-validator with sanitization
- **CSRF Protection**: Token-based CSRF validation
- **HPP Protection**: HTTP Parameter Pollution prevention
- **Request Size Limits**: 10MB default limit
- **Security Audit Logging**: Comprehensive request/response logging
- **CORS Configuration**: Whitelist-based origin control

#### Authentication & Authorization

- **Argon2 Password Hashing**: Memory-hard hashing with configurable parameters
- **JWT with Refresh Tokens**: Short-lived access tokens (15min) with long-lived refresh (7d)
- **Two-Factor Authentication**: TOTP-based 2FA with OTPLib and Speakeasy
- **Session Security**: Secure, HTTP-only cookies with SameSite protection

#### npm Configuration (`.npmrc`)

- **Dependency Locking**: Prevents implicit upgrades
- **Script Execution Control**: Configurable install script handling
- **Automatic Auditing**: Security checks on every install
- **Strict SSL**: Enforces secure connections

#### Docker Security

- **Multi-stage Builds**: Minimal production image
- **Non-root User**: Runs as `nodejs` user (UID 1001)
- **Alpine Base**: Minimal attack surface
- **Security Updates**: Automatic OS-level updates
- **Health Checks**: Built-in container health monitoring

### 📦 Dependency Management

**Philosophy**: This project uses pre-release versions to stay on the cutting edge. This is intentional but requires:

1. **Regular Monitoring**:

   ```bash
   npm run security-check
   npm audit
   npm outdated
   ```

2. **Automated Scanning** (GitHub Actions):
   - npm audit on every push
   - Snyk security scanning
   - CodeQL analysis (security-and-quality queries)
   - Dependency review for PRs
   - Docker image scanning with Trivy
   - Secret scanning with TruffleHog
   - Weekly scheduled scans

3. **Update Strategy**:

   ```bash
   # Update all experimental dependencies
   npm run update:experimental

   # Force update to bleeding-edge
   npm run update:bleeding-edge
   ```

### 🔍 Monitoring & Observability

- **Health Checks**: Comprehensive endpoints at `/health/*`
  - Basic: `/health`
  - Detailed: `/health/detailed`
  - Kubernetes probes: `/health/ready`, `/health/live`, `/health/startup`
  - Security status: `/health/security`
  - Version info: `/health/version`
- **OpenTelemetry**: Distributed tracing
- **Prometheus Metrics**: Time-series monitoring
- **Sentry Error Tracking**: Real-time error monitoring
- **Pino Logging**: High-performance structured logging

## Known Security Advisories (Node.js 22)

### Recent CVEs (2025)

- **CVE-2025-27210**: Windows device names bypass (patched in 22.13.1+)
- **CVE-2025-23167**: HTTP header termination flaw (patched in 22.x)
- **CVE-2025-23084**: Path traversal vulnerabilities (patched)

**Action Required**: Always use Node.js 22.13.1 or later

```bash
node --version  # Should be ≥22.13.1
```

## GraphQL Security

### Implemented Protections

- **Query Depth Limiting**: Prevents deeply nested queries
- **Query Complexity Analysis**: Limits computational cost
- **Query Timeouts**: Maximum execution time enforcement
- **Rate Limiting**: Separate limits for GraphQL endpoints
- **Input Validation**: Schema-based validation with Zod
- **Introspection Control**: Disable in production (ENV: `GRAPHQL_INTROSPECTION=false`)

### Best Practices

1. Disable introspection in production
2. Implement query whitelisting for critical operations
3. Use persisted queries for production
4. Monitor query performance and complexity

## Reporting a Vulnerability

### If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. **Use GitHub Security Advisories** (preferred):
   - Go to Security tab → Report a vulnerability
3. **Or email**: skanda890@users.noreply.github.com
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Affected versions
   - Suggested fix (if any)
   - CVE ID (if already assigned)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 72 hours
- **Status Update**: Within 7 days
- **Fix Target**:
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: Next scheduled release

### Severity Levels

- **Critical** 🔴: Remote code execution, data breach, authentication bypass
- **High** 🟠: Privilege escalation, SQL injection, XSS
- **Medium** 🟡: Information disclosure, DoS vulnerabilities
- **Low** 🟢: Configuration issues, minor security improvements

## Known Risks with Experimental Versions

### Pre-release Dependencies

Using `next` and `latest` tags means:

✅ **Advantages**:

- Access to newest features
- Early bug fixes
- Cutting-edge performance improvements
- Latest security patches

⚠️ **Risks**:

- Potential instability
- Breaking API changes without warning
- Undiscovered vulnerabilities
- Limited production testing
- Incomplete documentation

### Mitigation Strategies

1. **Lock File**: We commit `package-lock.json` for reproducible builds
2. **Regular Audits**: Automated security checks on every commit
3. **Multiple Scanners**: Using several security tools for comprehensive coverage
4. **Rapid Response**: Fast patching when vulnerabilities are discovered
5. **Monitoring**: Real-time error tracking with Sentry
6. **Testing**: Comprehensive test coverage before deployment

## Security Best Practices for Users

### For Development

```bash
# Always check security status
npm run security-check

# Review audit report
npm audit

# Check outdated packages
npm outdated

# Run security-focused linting
npm run lint:check

# Run in development mode with detailed logs
npm run dev
```

### For Production (Not Recommended)

⚠️ **This project is experimental and not recommended for production use.**

If you must use it:

1. **Environment Configuration**:

   ```bash
   NODE_ENV=production
   ENABLE_HELMET=true
   ENABLE_RATE_LIMITING=true
   ENABLE_CSRF_PROTECTION=true
   ENABLE_2FA=true
   SESSION_SECURE=true
   GRAPHQL_INTROSPECTION=false
   GRAPHQL_PLAYGROUND=false
   ```

2. **Infrastructure**:
   - Run behind reverse proxy (nginx/Caddy)
   - Use HTTPS/TLS with valid certificates
   - Implement WAF rules (Cloudflare, AWS WAF)
   - Set up DDoS protection
   - Use containerization (Docker/Kubernetes)

3. **Monitoring**:
   - Enable all observability features
   - Set up alerting (PagerDuty, Opsgenie)
   - Regular security audits
   - Penetration testing

4. **Database Security**:
   - Use connection encryption
   - Implement IP whitelisting
   - Enable authentication
   - Regular backups

5. **Secrets Management**:
   - Use environment variables
   - Never commit secrets
   - Rotate credentials regularly
   - Use secret management service (Vault, AWS Secrets Manager)

## Security Checklist

### Application Level

- [x] Helmet.js security headers
- [x] Distributed rate limiting
- [x] Input validation and sanitization
- [x] CSRF protection
- [x] HPP protection
- [x] Request size limits
- [x] Memory leak prevention
- [x] Graceful error handling
- [x] Security audit logging

### Authentication & Authorization

- [x] Argon2 password hashing
- [x] JWT with refresh tokens
- [x] Two-factor authentication support
- [x] Secure session management
- [x] CORS configuration

### Infrastructure

- [x] Environment variable configuration
- [x] Docker security hardening
- [x] Health check endpoints
- [x] Kubernetes-ready probes

### Monitoring & CI/CD

- [x] Automated security scanning (GitHub Actions)
- [x] npm audit on CI
- [x] CodeQL analysis
- [x] Dependency review
- [x] Docker image scanning
- [x] Secret scanning
- [x] Dependabot alerts
- [x] Weekly security scans

### Dependencies

- [x] npm configuration hardening
- [x] Dependency locking
- [x] Regular updates
- [x] Multiple security scanners

## Additional Resources

### General Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### GraphQL Security

- [GraphQL Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [Apollo Server Security](https://www.apollographql.com/docs/apollo-server/security/)

### Dependency Security

- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [Node.js Security Releases](https://nodejs.org/en/blog/vulnerability/)

### Container Security

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

## Version History

| Date       | Version | Changes                                               |
| ---------- | ------- | ----------------------------------------------------- |
| 2025-12-15 | 2.0.0   | Enhanced security middleware, Docker hardening, CI/CD |
| 2024-12-05 | 1.0.0   | Initial security implementation                       |

---

**Remember**: This is an experimental project. Security is a shared responsibility. Stay vigilant, keep dependencies updated, and report issues promptly.

🔒 **Security is not a feature, it's a process.**
