# Changelog — Backend fixes

All changes are non-breaking and preserve existing API behavior. No database schema changes were made.

## 2026-07-19
- fix: Guard scheduled booking cleanup when `DATABASE_URL` is not set or `NODE_ENV=test` to avoid Prisma initialization errors during local runs and tests. (file: `src/index.js`)
- fix: Attempt graceful server shutdown before exiting on fatal errors to reduce abrupt terminations. (file: `src/index.js`)
- feat: Add a simple JS syntax check script `scripts/check_syntax.js` to quickly validate JS files during development.
- chore: Add ESLint configuration and `lint` script to enforce code quality. (files: `.eslintrc.json`, `package.json`)
- fix: Small lint fixes across routes to improve code safety and silence warnings without changing behavior:
  - `src/routes/auth.routes.js` — simplified password regex and sanitize fix
  - `src/routes/booking.routes.js` — handle JSON parse errors for signatures
  - `src/routes/listing.routes.js` — minor variable rename to avoid unused-var warning
  - `src/routes/user.routes.js` — minor variable renames to avoid unused-var warnings

### Dependency updates (safe fixes)
- chore: Applied non-breaking `npm audit fix --no-force` to address several transitive vulnerabilities. Some moderate/high advisories remain that require forceful upgrades (e.g., `firebase-admin` -> `14.2.0`) which may be breaking. See `npm audit` output for details.

Notes:
- The `package-lock.json` was updated and committed. No direct `package.json` major-version changes were applied.
- Requesting confirmation before applying `npm audit fix --force` (major upgrades) because those can change runtime behavior or require manual review.

Notes:
- No public API endpoints were modified in their input/output contracts.
- No Prisma schema migrations or `prisma` changes were applied.
- For local development, set `DATABASE_URL` in `.env` if you want the scheduled cleanup to run.
