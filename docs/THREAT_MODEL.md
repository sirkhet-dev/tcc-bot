# Threat Model

## Assets

- Telegram bot token
- Authorized user ID and project metadata
- Prompt/response content
- Host workspace and repository files

## Trust Boundaries

- Telegram update stream -> bot process
- Bot process -> Claude CLI subprocess
- Bot process -> workspace filesystem

## Key Threats

- Unauthorized Telegram access attempts
- Resource exhaustion through repeated prompts
- Unsafe project execution scope
- Sensitive output leakage to logs/messages

## Existing Controls

- Single-user allowlist middleware
- Prompt length and per-user rate limits
- Workspace scan constrained to Git repos (optionally allowlisted)
- Timeout and process cancellation controls
- CI + audit + secret scanning

## Next Hardening Steps

- Add optional project-level command allow/deny policy
- Add alerting for repeated authorization failures
- Add integration tests for auth, rate-limit, and process-stop flows
