# Architecture

## Overview

TCC Bot is a self-hosted Telegram bot that provides remote access to Claude Code CLI. It runs on your own server with no external service dependencies beyond the Telegram Bot API.

## System Architecture

```
Telegram App  <-->  Telegram API  <-->  Bot (long polling)  <-->  Claude Code (subprocess)
                                             |
                                        Project directory (cwd)
```

- **Input:** User sends a message via Telegram
- **Auth:** User ID whitelist check (single user)
- **Queue:** One concurrent operation per user; busy state blocks new requests
- **Claude:** `claude -p` subprocess spawn with JSON output parsing
- **Output:** Markdown → Telegram HTML conversion, 4096 char smart splitting

## Claude Code Integration

```bash
claude -p "<prompt>" \
  --output-format json \
  --dangerously-skip-permissions \
  --resume <session_id>
```

| Flag | Purpose |
|------|---------|
| `-p` | Non-interactive (programmatic) mode |
| `--output-format json` | Structured output: `result`, `session_id`, `cost_usd`, `is_error` |
| `--dangerously-skip-permissions` | Skip permission prompts for automation |
| `--resume` | Continue a previous session |
| `cwd` | Determines which project directory Claude operates in |

## Telegram Bot API

- **Method:** Long polling (`getUpdates`) — no port/domain/SSL required
- **Parse mode:** HTML (more reliable than MarkdownV2 for generated content)
- **Message limit:** 4096 characters (handled by smart splitting)
- **Inline keyboard:** Used for project selection via callback queries

## Data Flow

1. grammY receives update via long polling
2. Auth middleware checks `from.id` against `ALLOWED_USER_ID`
3. Command router handles slash commands; text messages go to queue
4. Queue validates state (project selected, not busy)
5. Runner spawns Claude Code subprocess with project `cwd`
6. stdout collected → JSON parsed → result extracted
7. Formatter converts Markdown to Telegram HTML
8. Splitter divides at logical boundaries if > 4096 chars
9. Response sent back as one or more Telegram messages
10. Session ID stored for next prompt continuation

## Key Design Decisions

- **Long polling over webhooks** — Simpler setup, no port/domain/SSL needed, ideal for single-user bot
- **In-memory state** — No database needed; state resets on restart (by design)
- **Single concurrent process** — Prevents resource exhaustion and overlapping Claude sessions
- **HTML parse mode** — More predictable than MarkdownV2 for code-heavy output
- **Smart message splitting** — Preserves code block integrity across message boundaries
