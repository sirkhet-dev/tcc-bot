<div align="center">

# TCC Bot

**Access Claude Code remotely through Telegram.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![grammY](https://img.shields.io/badge/grammY-1.39+-009DC4)](https://grammy.dev/)

</div>

---

TCC Bot is a self-hosted Telegram bot that lets you interact with [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) from anywhere. Send prompts from your phone, get formatted responses back — with full session continuity and multi-project support.

```
You (Telegram) → Bot (your server) → Claude Code CLI → Your Projects
```

## Features

- **Remote Claude Code access** — Send prompts and receive responses via Telegram
- **Multi-project support** — Switch between projects with inline buttons
- **Session continuity** — Conversations persist across messages within a project
- **Smart formatting** — Markdown → Telegram HTML with code syntax highlighting
- **Intelligent message splitting** — Long responses split at logical boundaries (code blocks, paragraphs)
- **Process control** — Cancel running operations with `/stop`
- **Single-user auth** — Whitelist-based access by Telegram user ID
- **Lightweight** — ~600 lines of TypeScript, 5 runtime dependencies

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview) installed and authenticated
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram user ID from [@userinfobot](https://t.me/userinfobot)

### Setup

```bash
# Clone the repository
git clone https://github.com/sirkhet-dev/tcc-bot.git
cd tcc-bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Build and run
npm run build
npm start
```

### Docker

```bash
# Configure environment
cp .env.example .env
# Edit .env with your values

# Create a projects directory and place your projects inside
mkdir projects

# Run with Docker Compose
docker compose up -d
```

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with project list |
| `/projects` | Select a project (inline buttons) |
| `/project <name>` | Set active project by name |
| `/new` | Start a fresh Claude session |
| `/stop` | Cancel the running operation |
| `/status` | Show current state |
| `/help` | List all commands |

Any regular text message is sent as a prompt to Claude Code in the active project's directory.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | Yes | — | Telegram bot token from @BotFather |
| `ALLOWED_USER_ID` | Yes | — | Your Telegram user ID (numeric) |
| `CLAUDE_BIN` | No | `claude` | Path to Claude Code binary |
| `WORKSPACE_ROOT` | No | `./projects` | Directory containing your projects |
| `RESPONSE_TIMEOUT_MS` | No | `300000` | Claude Code timeout in ms (5 min) |

## Deployment

### systemd (Linux)

A template service file is provided in `systemd/tcc-bot.service`.

```bash
# Copy and edit the service file
sudo cp systemd/tcc-bot.service /etc/systemd/system/
sudo nano /etc/systemd/system/tcc-bot.service
# Update: User, WorkingDirectory, ExecStart, EnvironmentFile paths

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable tcc-bot
sudo systemctl start tcc-bot

# Check logs
journalctl -u tcc-bot -f
```

### Docker

```bash
docker compose up -d

# View logs
docker compose logs -f
```

## How It Works

```
Telegram App
    ↕
Telegram API (long polling)
    ↕
┌─────────────────────────────────┐
│  TCC Bot (Node.js)              │
│                                 │
│  ┌─── Auth Middleware           │
│  │    (User ID whitelist)       │
│  │                              │
│  ├─── Command Router            │
│  │    (/start, /projects, ...)  │
│  │                              │
│  ├─── Message Queue             │
│  │    (1 concurrent per user)   │
│  │                              │
│  ├─── Claude Runner             │
│  │    (subprocess: claude -p)   │
│  │                              │
│  └─── Formatter                 │
│       (Markdown → Telegram HTML)│
└─────────────────────────────────┘
    ↕
Claude Code CLI
    ↕
Your Project Directory (cwd)
```

1. **Authentication** — Every update is checked against the whitelisted user ID
2. **Project selection** — User picks a project; Claude runs with that directory as `cwd`
3. **Prompt execution** — `claude -p "<prompt>" --output-format json` spawned as subprocess
4. **Session continuity** — `session_id` from response is stored and passed via `--resume` on next prompt
5. **Response formatting** — Markdown converted to Telegram HTML, split at 4096 char boundaries

## Project Structure

```
src/
├── index.ts              # Entry point + graceful shutdown
├── config.ts             # Zod environment validation
├── logger.ts             # Pino logger
├── bot/
│   ├── bot.ts            # grammY setup, handler registration
│   ├── commands.ts       # Slash command implementations
│   ├── middleware.ts      # Auth middleware
│   ├── formatter.ts       # Markdown → HTML + message splitting
│   └── message-handler.ts # Text → Claude prompt routing
├── claude/
│   ├── runner.ts          # Claude Code subprocess management
│   └── queue.ts           # Concurrency control + response delivery
└── state/
    ├── user-state.ts      # In-memory session state
    └── projects.ts        # Workspace project discovery
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22+ |
| Language | TypeScript (strict) |
| Telegram SDK | [grammY](https://grammy.dev/) |
| Env Validation | [Zod](https://zod.dev/) |
| Logging | [Pino](https://getpino.io/) |
| AI Backend | [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview) |

## Security

- **Single-user only** — Only the configured Telegram user ID can interact with the bot
- **Silent rejection** — Unauthorized users receive no response (no information leakage)
- **No secrets in code** — All sensitive values loaded from environment
- **Process isolation** — Each Claude execution runs as a separate subprocess

> **Note:** This bot uses `--dangerously-skip-permissions` flag when calling Claude Code to enable non-interactive execution. Only run this on machines you trust, with projects you control.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
