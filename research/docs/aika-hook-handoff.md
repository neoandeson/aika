# aika-hook → aika-app Handoff

> Decisions and implementation details from the aika public repo that aika-app needs to know.

## What Was Built (aika public repo)

The CLI (`@aikadev/aika`) with complete hooks module:

### Hook Scripts (.mjs, executed by Claude Code directly)
- `on-prompt.mjs` — UserPromptSubmit → logs slash commands
- `dispatcher.mjs` — PostToolUse (Write|Edit|MultiEdit|Bash) → logs file changes  
- `on-stop.mjs` — Stop/SubagentStop → logs session end + **generates .aika/context.md**
- `shared.mjs` — shared helpers (appendJournal, postCapture, updateContext, readStdinJson)

### Key Implementation Decisions

| Decision | What we chose | Why |
|----------|--------------|-----|
| Hook scripts | Node.js `.mjs` (not bash) | Cross-platform, no shell compatibility issues |
| Settings merge | Non-destructive append | Preserves other kits' hooks, idempotent |
| Port | Configurable via `AIKA_PORT` env, default 4242 | User override without config files |
| Context tracking | `.aika/context.md` auto-generated on session end | Survives crashes, readable by CLAUDE.md on resume |
| Journal | `.aika/journal.jsonl` append-only | 3 event types: command_start, file_change, stop |

## What aika-app Needs to Implement

### POST /api/capture endpoint

Hooks POST to `http://localhost:{AIKA_PORT}/api/capture` with these exact payloads:

```jsonc
// command_start (from on-prompt.mjs)
{"type":"command_start","kit":"gsd","command":"/gsd:execute-phase","project":"/path/to/project"}

// file_change (from dispatcher.mjs)
{"type":"file_change","file":"src/main.ts","project":"/path/to/project"}

// session_stop (from on-stop.mjs)
{"type":"session_stop","transcript":"~/.claude/.../abc.jsonl","project":"/path/to/project"}
```

All POSTs are fire-and-forget with 2s timeout. Hooks don't check the response. If the app isn't running, they silently fail and still write to journal.

### MCP server at /mcp

Registered in `.claude/settings.json` as:
```json
{"mcpServers":{"aika":{"url":"http://localhost:4242/mcp"}}}
```

### Data files aika-app should read

These are created by the CLI, read by the app:

| File | Format | Created by | Read by |
|------|--------|-----------|---------|
| `.aika/catalog.json` | JSON | `aika detect` (future) | Kit Engine |
| `.aika/flow.json` | JSON | `aika flow` (future) | Kit Engine |
| `.aika/journal.jsonl` | JSONL | Hook scripts | Kit Engine (capture.go) |
| `.aika/context.md` | Markdown | on-stop.mjs | CLAUDE.md (session resume) |

### Port contract

Both repos read `AIKA_PORT` env variable, default 4242. The app should:
- Listen on `AIKA_PORT` (or 4242)
- Serve HTTP at that port (capture + MCP)
- The CLI and hooks will use the same env var to find the app

## File Locations

```
~/.aika/                          # Global (created by aika start)
  bin/aika-app                    # Desktop binary
  bin/codebase-memory-mcp         # CBM binary  
  config.json                     # Global settings

<project>/.aika/                  # Per-project (created by aika init)
  hooks/                          # Hook scripts (from CLI)
  catalog.json                    # Kit detection
  flow.json                       # Step sequences
  journal.jsonl                   # Event log
  context.md                      # Session summary (git-tracked)

<project>/.claude/settings.json   # Hook + MCP registration
```

## Test Commands

To verify aika-app's capture endpoint works with existing hooks:

```bash
# 1. Start aika-app (should listen on :4242)
# 2. In a project with aika init done:
echo '{"prompt":"/gsd:test"}' | node .aika/hooks/on-prompt.mjs
# → app should receive POST with type: command_start

echo '{"tool_name":"Write","tool_input":{"file_path":"test.ts"}}' | node .aika/hooks/dispatcher.mjs
# → app should receive POST with type: file_change

echo '{"transcript_path":"test.jsonl"}' | node .aika/hooks/on-stop.mjs
# → app should receive POST with type: session_stop
```
