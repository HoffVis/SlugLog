<p align="center">
  <img src="docs/icon.png" width="128" alt="SlugLog icon" />
</p>

<h1 align="center">SlugLog</h1>

<p align="center">
  <strong>Dev journal & timetracker for people who do great work but forget to write it down.</strong><br/>
  A dev journal that doubles as a timesheet cheat-sheet — because<br/>
  "what did I even do this week?" shouldn't be a Friday crisis.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="platform" />
</p>

---

## What is this?

SlugLog is a desktop app + CLI for logging your dev work. Two fields — description and hours. Everything else is optional.

It comes with a slug. The slug lives in your menu bar. If you don't log your work, the slug dies. Turns out, that's the only motivation that actually works.

## Features

**sLog** — Weekly timeline view, git-graph style. Click any day to see details and edit entries. Quick-add bar for logging in seconds.

**sBoard** — Simple kanban board (To Do / In Progress / Done). Start a timer on any ticket — when you stop it, hours are automatically logged. One timer at a time.

**sProjects** — Configure projects with names, project numbers, and default task areas. Details carry over to log entries automatically.

**Tray Popup** — Quick-add from the menu bar without opening the full app. See today's entries and your week at a glance.

**CLI** — Log from your terminal with `slug start`, `slug stop`, `slug log`. Same database, same slug.

**Sync Indicator** — Mark entries as "synced" when you've transferred them to your timesheet or invoice. Synced entries fade out so you can see what's left.

## The Slug

Every timetracker you've tried felt like homework. The slug is different. It doesn't nag you with notifications or guilt-trip you with dashboards. It just sits there, slowly dying if you don't feed it.

| Mood | Trigger |
|------|---------|
| Amazed | 8+ hours logged |
| Impressed | 6–8 hours logged |
| Happy | 4–6 hours logged |
| Worried | 1 working day without logging |
| Judgemental | 2 days without logging |
| Existential Crisis | 3 days without logging |
| Hungry | 4–5 days without logging |
| Dying | 6–9 days without logging |
| Ghost | 10+ days — the slug is gone. You did this. |

### Slug Budget

When you stop a timer, the slug doesn't just log raw elapsed time. It checks your daily budget (default 8h with 1h breathing room) and caps the proposed hours to fit. Because nobody actually works 8 focused hours in a day, and pretending otherwise helps no one.

## Download

**[Download SlugLog v0.1.0 for macOS](https://github.com/HoffVis/SlugLog/releases/latest)** (Apple Silicon)

> **First launch:** macOS may block the app since it's unsigned. Right-click the app and select Open, or run the included `install.command` to fix this automatically.

Windows and Linux users can build from source (see below).

## Build from Source

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/) prerequisites for your platform

### Build & Run

```bash
# Clone
git clone https://github.com/HoffVis/SlugLog.git
cd SlugLog

# Install JS dependencies
npm install

# Run in dev mode
npm run tauri:dev

# Build for release
npm run tauri:build
```

### Install the CLI

```bash
cargo install --path crates/sluglog-cli
```

This installs the `slug` command. The CLI and the desktop app share the same SQLite database at `~/Documents/sluglog/sluglog.db`.

## CLI Usage

### Timer workflow (recommended)

```bash
slug start "Implementing the thing"
slug start "Fixing the other thing" --project "My Project"
slug status
slug stop    # Auto-logs with slug-budgeted hours
```

Starting a new task auto-stops and logs the previous one.

### Quick log

```bash
slug log "Fixed that bug" 2.0
slug log "Updated docs" 1.0 --project "My Project" --pn 6003 --area documenting
```

### View entries

```bash
slug today   # Today's entries
slug week    # Week summary by day and project
```

### Task areas

`programming` `testing` `bug` `meeting` `documenting` `investigating`

## Claude Code Integration

Run `slug-init` in any project directory to add SlugLog instructions to your `CLAUDE.md`. This teaches Claude Code to use `slug start` / `slug stop` while working, so your AI pair-programmer logs its own time.

## Philosophy

- **Two fields, not twenty.** Description and hours. Everything else is optional. If logging feels like work, you won't do it.
- **Messy is fine.** Forgot the project name? Log it anyway. You can fix it later. A vague entry is infinitely better than no entry.
- **Not a system. A companion.** No workflows to learn. No processes to follow. Just you, a slug, and whatever you managed to get done today.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Tauri 2, Rust
- **Database:** SQLite (via rusqlite)
- **CLI:** Rust (clap)

## License

MIT

---

<p align="center"><em>Made with caffeine and a pirate slug.</em></p>
