# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Loyalty Workshop seriously. If you discover a security vulnerability, please follow these steps:

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
- **Email**: security@voucherify.io
- **Subject**: [SECURITY] Loyalty Workshop - Brief description

### What to Include

Please include the following information in your report:

1. **Type of vulnerability** (e.g., XSS, CSRF, injection, authentication bypass)
2. **Full paths of affected source files**
3. **Location of the affected code** (tag/branch/commit or direct URL)
4. **Step-by-step instructions to reproduce the issue**
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact of the vulnerability** and how it might be exploited
7. **Any suggested fixes** (optional)

### What to Expect

- **Initial Response**: Within 48 hours, we'll acknowledge receipt of your report
- **Status Updates**: We'll keep you informed about the progress of fixing the vulnerability
- **Resolution Timeline**: We aim to resolve critical vulnerabilities within 7-14 days
- **Credit**: With your permission, we'll credit you in the security advisory and release notes

### Disclosure Policy

- **Coordinated Disclosure**: Please give us reasonable time to fix the vulnerability before public disclosure
- **Typical Timeline**: 90 days from initial report to public disclosure
- **Public Advisory**: Once fixed, we'll publish a security advisory with details and credit

## Security Best Practices for Users

When using Loyalty Workshop:

1. **Never commit credentials** to version control
2. **Use environment variables** or secure credential storage for API keys
3. **Keep dependencies updated** by running `npm update` regularly
4. **Run with least privilege** - don't use root/admin accounts
5. **Review the API Inspector logs** before sharing screenshots or logs publicly (they may contain sensitive data)
6. **Use HTTPS** when connecting to production APIs
7. **Validate all API responses** before processing

## Known Security Considerations

### Client-Side Credential Storage

Loyalty Workshop stores API credentials in browser `localStorage` for convenience during development. This is suitable for:
- Local development environments
- Testing against non-production backends
- Internal development tools

**This is NOT suitable for:**
- Production deployments serving end users
- Storing production API credentials
- Multi-tenant scenarios

### API Inspector Logging

All API requests and responses are logged in memory and displayed in the API Inspector. These logs:
- Persist only for the current browser session
- May contain sensitive data (tokens, personal information)
- Should not be shared publicly without redaction

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1) and announced through:
- GitHub Security Advisories
- Release notes in [CHANGELOG.md](CHANGELOG.md)
- Repository announcements

## Questions?

If you have questions about this security policy, please email security@voucherify.io.
