# Aika — AI Kit Awareness

> One project. Many kits. Zero conflicts. Full awareness.

Aika manages AI development kits (GSD, BMAD, gstack, OpenSpec, etc.) installed into Claude Code. It detects kits, catalogs their commands, tracks activity via hooks, and exposes everything through MCP — so your AI tools always know what's happening.

## What Aika Does

- **Hooks** — Captures Claude Code activity (slash commands, file changes, session ends) into a local journal
- **Journal** — Append-only `.aika/journal.jsonl` logs every kit command and file touched
- **Context** — Auto-generates `.aika/context.md` on session end — a human-readable summary of what happened, for session resume
- **Capture API** — Forwards events to the Aika desktop app for real-time awareness
- **Scaffolding** — `aika init` sets up hooks and MCP registration in one command, non-destructively alongside other kits

## Install

```bash
npm install -g @aikadev/aika
```

Requires Node.js 18+.

## Quick Start

```bash
cd your-project
aika init
```

This creates:

```
.aika/
  hooks/
    on-prompt.mjs      # Tracks slash command usage
    dispatcher.mjs     # Tracks file changes from tool use
    on-stop.mjs        # Logs session completion
    shared.mjs         # Shared helpers (journal + capture)
  catalog.json         # Kit catalog placeholder

.claude/settings.json  # Hook entries + MCP server registration (merged)
```

## How It Works

### Hooks

Aika registers 3 hooks in `.claude/settings.json`:

| Hook | Event | What it captures |
|------|-------|------------------|
| `on-prompt.mjs` | `UserPromptSubmit` | Slash commands (`/gsd:execute-phase`, `/bmad:analyse`, etc.) |
| `dispatcher.mjs` | `PostToolUse` | File changes from Write, Edit, MultiEdit, Bash |
| `on-stop.mjs` | `Stop`, `SubagentStop` | Session end + auto-generates `context.md` |

Each hook:
1. Reads JSON from stdin (provided by Claude Code)
2. Appends an event to `.aika/journal.jsonl`
3. POSTs the event to the Aika desktop app (silent failure if not running)

Additionally, `on-stop.mjs` reads the full journal and generates `.aika/context.md` — a summary of the session for quick resume.

### Journal Format

`.aika/journal.jsonl` — one JSON object per line:

```jsonc
{"ts":"2026-04-08T10:00:00Z","event":"command_start","kit":"gsd","command":"/gsd:execute-phase"}
{"ts":"2026-04-08T10:01:30Z","event":"file_change","file":"src/main.ts"}
{"ts":"2026-04-08T10:15:00Z","event":"stop","transcript":"~/.claude/projects/.../session.jsonl"}
```

### Context File

`.aika/context.md` is auto-generated when a session ends. It provides:

- **Last session summary** — which commands ran, which files were touched
- **All-time stats** — total sessions, commands, files, kits used

This is what `CLAUDE.md` points to for session resume. When you start a new session (or recover from a crash), the AI reads `context.md` and immediately knows what happened last.

```markdown
# Aika Context
## Last Session
**Commands run:**
- `/gsd:execute-phase` (gsd)
**Files touched:** 3
- `src/app.ts`
- `src/utils.ts`
- `package.json`

## Stats
- **Sessions:** 5
- **Total commands:** 12
- **Total files touched:** 28
- **Kits used:** gsd, bmad
```

The file is git-tracked (rest of `.aika/` is gitignored) so context survives across machines.

### Connecting to Aika Desktop App

Hooks forward events to the Aika desktop app at `http://localhost:4242/api/capture`. The app provides a dashboard, flow editor, and code intelligence via MCP.

The MCP server is registered at `http://localhost:4242/mcp` so Claude Code can query kit context, status, and code intelligence tools.

If the desktop app isn't running, hooks still work — they write to the journal and silently skip the HTTP POST.

## Configuration

### Port

Default port is `4242`. Override via environment variable:

```bash
export AIKA_PORT=5000
aika init
```

This affects:
- The MCP server URL registered in `.claude/settings.json`
- The capture API endpoint hooks POST to
- The port shown in CLI output

### Re-initialize

Running `aika init` is idempotent — it won't duplicate hooks or overwrite existing kit configurations in `.claude/settings.json`. Safe to run multiple times.

## Using with Other Kits

Aika is designed to coexist. `aika init` merges its hook entries alongside existing hooks from other kits (GSD, gstack, etc.) — it never removes or modifies other entries.

```jsonc
// .claude/settings.json after aika init (with existing gstack hooks)
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "gstack-hook.sh" }] },
      { "matcher": "Write|Edit|MultiEdit|Bash", "hooks": [{ "type": "command", "command": "node .aika/hooks/dispatcher.mjs" }] }
    ]
  }
}
```

## Uninstall

### Remove from a project

Delete Aika's files and hook entries:

```bash
# Remove Aika data
rm -rf .aika/

# Remove hook entries from .claude/settings.json
# Edit .claude/settings.json and remove entries containing ".aika/hooks/"
# Also remove the "aika" key from "mcpServers" if present
```

### Uninstall globally

```bash
npm uninstall -g @aikadev/aika
```

## Development

```bash
git clone https://github.com/neoandeson/aika.git
cd aika
npm install
npm run build     # Compile TypeScript + copy hook scripts
npm test          # Run all tests
npm run dev       # Watch mode (TypeScript only)
```

### Project Structure

```
src/
  index.ts              # CLI entry (commander)
  config.ts             # Port configuration (AIKA_PORT env)
  commands/
    init.ts             # aika init — scaffold + register
  hooks/
    on-prompt.mjs       # UserPromptSubmit hook
    dispatcher.mjs      # PostToolUse hook
    on-stop.mjs         # Stop/SubagentStop hook + context generation
    shared.mjs          # Common: journal write, capture POST, context generation
  journal/
    writer.ts           # Journal append (TypeScript, for CLI use)
  capture/
    client.ts           # HTTP POST client (TypeScript, for CLI use)
  scaffold/
    settings.ts         # Merge hooks into .claude/settings.json
    files.ts            # Copy hook scripts to .aika/hooks/
schema/
  journal.schema.json
  capture-event.schema.json
```

## Architecture

Aika has two repos:

- **`neoandeson/aika`** (this repo, public, MIT) — CLI + hooks + scaffolding
- **`neoandeson/aika-app`** (private) — Wails desktop app with kit engine, MCP server, dashboard

The CLI sets up hooks and talks to the desktop app. The desktop app provides the intelligence layer.

## License

MIT
