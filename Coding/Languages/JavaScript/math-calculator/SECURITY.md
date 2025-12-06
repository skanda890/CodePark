# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Security Features

### Input Validation & Sanitization

The math-calculator implements comprehensive input validation:

1. **Expression Length Limit**: Maximum 10,000 characters to prevent DoS attacks
2. **Character Sanitization**: Removes potentially dangerous characters (`; < > { } [ ] \`)
3. **Pattern Detection**: Blocks suspicious code patterns:
   - `require()`
   - `import`
   - `eval()`
   - `function()`
   - `__proto__`
   - `constructor`
   - Template literals

### Rate Limiting

- **General Endpoints**: 100 requests per 15 minutes per IP
- **Calculate Endpoint**: 20 requests per minute per IP (stricter for compute-intensive operations)

### HTTP Security Headers (Helmet.js)

- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Strict-Transport-Security

### Request Size Limiting

- Maximum request body size: 100KB
- Prevents memory exhaustion attacks

## Known Vulnerabilities Fixed in v2.0.0

### 1. Code Injection Prevention
**Issue**: Previous version didn't sanitize user inputs before evaluation  
**Fix**: Implemented comprehensive input validation and sanitization  
**Severity**: High  
**Status**: ✅ Fixed

### 2. Denial of Service Protection
**Issue**: No limits on expression length or calculation complexity  
**Fix**: Added 10,000 character limit and rate limiting  
**Severity**: Medium  
**Status**: ✅ Fixed

### 3. Missing Security Headers
**Issue**: No security headers in HTTP responses  
**Fix**: Integrated helmet.js for comprehensive security headers  
**Severity**: Medium  
**Status**: ✅ Fixed

### 4. Rate Limiting Gaps
**Issue**: Rate limiting only applied to one endpoint  
**Fix**: Applied rate limiting to all endpoints with stricter limits for /calculate  
**Severity**: Medium  
**Status**: ✅ Fixed

### 5. Unsafe Error Messages
**Issue**: Error messages could leak internal implementation details  
**Fix**: Sanitized error messages, hide internal details in production  
**Severity**: Low  
**Status**: ✅ Fixed

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Reporting Process

1. **Do NOT** open a public issue for security vulnerabilities
2. Email the maintainer directly: [9980056379Skanda@gmail.com](mailto:9980056379Skanda@gmail.com)
3. Include in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Critical vulnerabilities within 14 days, others within 30 days

### Responsible Disclosure

We follow responsible disclosure practices:

1. Security researcher reports vulnerability privately
2. We confirm and develop a fix
3. We release the fix
4. After the fix is deployed, we publicly disclose the vulnerability

## Security Best Practices for Users

### Deployment

1. **Use HTTPS**: Always deploy behind HTTPS
2. **Environment Variables**: Use environment variables for sensitive configuration
   ```bash
   PORT=4000 NODE_ENV=production npm run prod
   ```
3. **Reverse Proxy**: Deploy behind nginx or similar reverse proxy for additional security
4. **Firewall**: Use firewall rules to restrict access if needed

### Configuration

1. **Rate Limiting**: Adjust rate limits based on your use case
2. **Monitoring**: Monitor for suspicious patterns in logs
3. **Updates**: Keep dependencies updated regularly

### Example Secure Deployment (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name calculator.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers (additional to helmet.js)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Rate limiting tested and configured
- [ ] HTTPS enabled
- [ ] Security headers verified (use [securityheaders.com](https://securityheaders.com))
- [ ] Dependencies updated to latest secure versions
- [ ] Monitoring and logging configured
- [ ] Firewall rules in place
- [ ] Backup and disaster recovery plan

## Dependencies

### Security-Critical Dependencies

- **helmet** (^8.0.0): HTTP security headers
- **express-rate-limit** (^8.2.0): Rate limiting
- **express** (^5.2.1): Web framework

### Regular Security Audits

Run security audits regularly:

```bash
# NPM audit
npm audit

# Fix vulnerabilities
npm audit fix

# Snyk scan (if installed)
snyk test
```

## Security Updates

Subscribe to security updates:

1. Watch the repository for security advisories
2. Enable GitHub Dependabot alerts
3. Review and update dependencies monthly

## Contact

For security concerns, contact:
- Email: [9980056379Skanda@gmail.com](mailto:9980056379Skanda@gmail.com)
- GitHub: [@skanda890](https://github.com/skanda890)

## Attribution

We appreciate responsible security researchers. Security contributors will be acknowledged in:
- CHANGELOG.md
- Security advisory (if applicable)
- Contributors list

---

**Last Updated**: December 6, 2025  
**Version**: 2.0.0
