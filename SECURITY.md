# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | ✅ Active support  |
| < Latest| ❌ No support      |

## Reporting a Vulnerability

If you discover a security vulnerability in Rently, please report it responsibly.

**🚫 Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email**: Send details to `security@rently.in` (or your security contact)
2. **Subject line**: `[SECURITY] Brief description of the vulnerability`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### What to Expect

| Step | Timeline |
|------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 1 week |
| Fix deployment | Depends on severity (critical: 24-48h, high: 1 week, medium: next sprint) |
| Public disclosure | After fix is deployed + 7 days |

### Scope

The following are in scope:
- ✅ Authentication & authorization bypass
- ✅ SQL/NoSQL injection
- ✅ Cross-site scripting (XSS)
- ✅ Payment flow manipulation
- ✅ IDOR (Insecure Direct Object Reference)
- ✅ Privilege escalation
- ✅ Data exposure
- ✅ Server-side request forgery (SSRF)

The following are out of scope:
- ❌ Denial of Service (DoS) attacks
- ❌ Social engineering
- ❌ Physical attacks
- ❌ Issues in third-party services (Firebase, Razorpay, Cloudinary)

### Safe Harbor

We support safe harbor for security researchers who:
- Make a good faith effort to avoid privacy violations and data destruction
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report vulnerabilities promptly and do not publicly disclose before a fix is deployed

## Security Measures

### Backend
- JWT with token version revocation on logout
- bcrypt password hashing (cost factor 10)
- Rate limiting on auth, OTP, and AI endpoints
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- Prisma parameterized queries (SQL injection prevention)
- Zod input validation on all endpoints
- CORS with explicit origin allowlist
- httpOnly + secure cookies
- Cryptographic OTP generation (crypto.randomInt)
- Webhook HMAC signature verification

### Frontend
- Content Security Policy (CSP) headers
- In-memory auth tokens (not localStorage)
- XSS-safe React rendering (no dangerouslySetInnerHTML)
- Cookie consent management

### CI/CD
- `npm audit` on every push/PR (moderate+ severity fails build)
- Snyk continuous vulnerability scanning
- ESLint security rules
- Automated dependency updates

### Infrastructure
- HTTPS enforced in production
- Environment variables for all secrets (never committed)
- Database backups with point-in-time recovery
- Monitoring and alerting for anomalous activity

## Security Checklist for New Features

Before merging any new feature, verify:

- [ ] All user input is validated (Zod schema)
- [ ] All database queries use Prisma parameterized queries
- [ ] Authentication is required where needed (`requireAuth`)
- [ ] Authorization is checked (user can only access their own resources)
- [ ] Sensitive data is not logged
- [ ] Error messages don't leak internal details in production
- [ ] New dependencies are audited (`npm audit`)
- [ ] File uploads are type-checked and size-limited
