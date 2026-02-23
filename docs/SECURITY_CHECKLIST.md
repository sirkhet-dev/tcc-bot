# Security Checklist

## Pre-Release

- [ ] `npm audit --omit=dev` is clean or reviewed.
- [ ] CI (`build`, `audit`) is green.
- [ ] Secret scan is green.
- [ ] `.env.example` documents all security-related variables.

## Runtime

- [ ] `ALLOWED_USER_ID` is correct and tested.
- [ ] `PROJECT_ALLOWLIST` is configured for production.
- [ ] `CLAUDE_SKIP_PERMISSIONS=false` unless strictly required.
- [ ] Message rate limit and max prompt size are set appropriately.

## Operations

- [ ] Bot host has minimal filesystem access.
- [ ] Logs are monitored for repeated unauthorized attempts.
- [ ] Process supervisor restarts failed bot process.
