# aika-hook — Full Hooks Module Design

**Date:** 2026-04-08
**Scope:** Full hooks module — hook scripts + journal writer + capture API client + scaffolding/registration
**Package:** `@aikadev/aika` (public repo, MIT)

---

## 1. Context

Aika is a desktop app + CLI that manages AI development kits (GSD, BMAD, gstack, etc.) installed into Claude Code. The hooks module is the bridge between Claude Code activity and Aika's awareness — it captures events (slash commands, file changes, session stops) and feeds them to the journal log and the desktop app.

This is the first implementation work in the `aika` public repo. It establishes the project foundation (TypeScript CLI) and delivers the complete hooks subsystem.

---

## 2. Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full module (scripts + journal + capture + scaffold) | Ship a complete working piece, not partial |
| Platform | Node.js `.mjs` scripts | Cross-platform. Claude Code has Node available. No shell compatibility issues. |
| App comms | Full integration (journal + HTTP POST) | Graceful failure if app not running. No feature gating needed. |
| Settings merge | Non-destructive append | Preserve other kits' hooks. Detect Aika entries by path for idempotency. |
| Architecture | Monorepo CLI package | Matches the public repo spec. Hooks ship as part of `@aikadev/aika`. |

---

## 3. Project Structure

```
aika/
├── src/
│   ├── index.ts                    # CLI entry (commander)
│   ├── commands/
│   │   ├── init.ts                 # aika init — scaffold .aika/, register hooks
│   │   └── detect.ts               # aika detect — stub for future
│   ├── hooks/
│   │   ├── on-prompt.mjs           # UserPromptSubmit — track slash commands
│   │   ├── dispatcher.mjs          # PostToolUse — track file changes
│   │   ├── on-stop.mjs             # Stop/SubagentStop — session complete
│   │   └── shared.mjs              # Common: journal write + capture POST
│   ├── journal/
│   │   └── writer.ts               # TypeScript journal append (for CLI use)
│   ├── scaffold/
│   │   ├── settings.ts             # Merge hooks + MCP into .claude/settings.json
│   │   └── files.ts                # Copy hook scripts to .aika/hooks/
│   └── capture/
│       └── client.ts               # HTTP client for POST /api/capture
├── schema/
│   ├── journal.schema.json         # Journal entry schema
│   └── capture-event.schema.json   # Capture event schema
├── package.json
├── tsconfig.json
├── .gitignore
└── research/docs/                  # Existing specs (unchanged)
```

---

## 4. Hook Scripts Behavior

All hooks: read stdin (JSON from Claude Code) → process → append journal → POST capture → exit 0 always.

### 4.1 on-prompt.mjs (UserPromptSubmit)

**Trigger:** Every user prompt submission.

```
stdin → { prompt: "/gsd:execute-phase 3", ... }

1. Parse stdin JSON
2. Check if prompt starts with "/" — if not, exit 0
3. Extract command name: "/gsd:execute-phase"
4. Extract kit name: "gsd" (text before first ":")
5. Append to .aika/journal.jsonl:
   {"ts":"2026-04-08T10:00:00Z","event":"command_start","kit":"gsd","command":"/gsd:execute-phase"}
6. POST to localhost:4242/api/capture:
   {"type":"command_start","kit":"gsd","command":"/gsd:execute-phase","project":"/path/to/project"}
7. Exit 0
```

### 4.2 dispatcher.mjs (PostToolUse — matches Write|Edit|MultiEdit|Bash)

**Trigger:** After Write, Edit, MultiEdit, or Bash tool use.

```
stdin → { tool_name: "Write", tool_input: { file_path: "src/main.ts" }, ... }

1. Parse stdin JSON
2. Extract file_path from tool_input.file_path or tool_input.file
3. No file_path → exit 0
4. Append to .aika/journal.jsonl:
   {"ts":"...","event":"file_change","file":"src/main.ts"}
5. POST to localhost:4242/api/capture:
   {"type":"file_change","file":"src/main.ts","project":"/path/to/project"}
6. Exit 0
```

### 4.3 on-stop.mjs (Stop / SubagentStop)

**Trigger:** Session ends or subagent completes.

```
stdin → { transcript_path: "~/.claude/.../abc.jsonl", cwd: "/path/to/project" }

1. Parse stdin JSON
2. Extract transcript_path and cwd (fallback to process.cwd())
3. Append to .aika/journal.jsonl:
   {"ts":"...","event":"stop","transcript":"~/.claude/.../abc.jsonl"}
4. POST to localhost:4242/api/capture:
   {"type":"session_stop","transcript":"...","project":"/path/to/project"}
5. Exit 0
```

### 4.4 shared.mjs — Common Functions

Two exports:

- **appendJournal(cwd, entry)** — Append JSON line to `{cwd}/.aika/journal.jsonl`. Create `.aika/` directory and file if missing. No-throw (catch + ignore errors).
- **postCapture(payload)** — `fetch("http://localhost:4242/api/capture", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload), signal: AbortSignal.timeout(2000) })`. Wrapped in try/catch, silent failure. Fire-and-forget.

---

## 5. Data Structures

### 5.1 journal.jsonl — Append-only event log

Three event types, one JSON object per line:

```jsonc
{"ts":"2026-04-08T10:00:00Z","event":"command_start","kit":"gsd","command":"/gsd:execute-phase"}
{"ts":"2026-04-08T10:01:30Z","event":"file_change","file":"src/main.ts"}
{"ts":"2026-04-08T10:15:00Z","event":"stop","transcript":"~/.claude/projects/.../abc.jsonl"}
```

### 5.2 capture event — HTTP POST body

```jsonc
// command_start
{"type":"command_start","kit":"gsd","command":"/gsd:execute-phase","project":"/path/to/project"}

// file_change
{"type":"file_change","file":"src/main.ts","project":"/path/to/project"}

// session_stop
{"type":"session_stop","transcript":"~/.claude/.../abc.jsonl","project":"/path/to/project"}
```

---

## 6. Scaffolding — `aika init`

### Step 1: Create `.aika/` structure

```
.aika/
├── hooks/
│   ├── on-prompt.mjs
│   ├── dispatcher.mjs
│   ├── on-stop.mjs
│   └── shared.mjs
└── catalog.json            # Empty {} placeholder
```

Hook scripts are copied from the installed package's `dist/hooks/` directory (resolved via `import.meta.url` or `__dirname` relative to the CLI entry point). During development, they come from `src/hooks/`. The `tsconfig.json` must be configured to copy `.mjs` files to `dist/hooks/` during build (or use a build script).

### Step 2: Merge into `.claude/settings.json`

Non-destructive merge rules:
- If `.claude/settings.json` doesn't exist → create `.claude/` dir and file
- If a hook category exists (e.g. `PostToolUse`) → append Aika's entry to the array
- If Aika entry already exists (detect by command path containing `.aika/hooks/`) → skip (idempotent)
- Never remove or modify other kits' entries
- Add `mcpServers.aika` if not already present

Target settings.json state after merge:

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node .aika/hooks/on-prompt.mjs" }] }
    ],
    "PostToolUse": [
      // ... existing entries preserved ...
      { "matcher": "Write|Edit|MultiEdit|Bash",
        "hooks": [{ "type": "command", "command": "node .aika/hooks/dispatcher.mjs" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node .aika/hooks/on-stop.mjs" }] }
    ],
    "SubagentStop": [
      { "hooks": [{ "type": "command", "command": "node .aika/hooks/on-stop.mjs" }] }
    ]
  },
  "mcpServers": {
    "aika": { "url": "http://localhost:4242/mcp" }
  }
}
```

### Step 3: Print summary

```
✓ Created .aika/hooks/ (4 files)
✓ Registered hooks in .claude/settings.json
✓ Registered MCP server: aika → localhost:4242
  Run "aika start" to launch the desktop app.
```

---

## 7. Capture Client (`capture/client.ts`)

TypeScript module for use by CLI commands and hook scripts:

```typescript
const CAPTURE_URL = "http://localhost:4242/api/capture";
const TIMEOUT_MS = 2000;

interface CaptureEvent {
  type: "command_start" | "file_change" | "session_stop";
  project: string;
  kit?: string;
  command?: string;
  file?: string;
  transcript?: string;
}

async function postCapture(event: CaptureEvent): Promise<void> {
  // fetch with AbortSignal.timeout, try/catch, silent failure
}
```

---

## 8. Journal Writer (`journal/writer.ts`)

TypeScript module for CLI-side journal operations:

```typescript
interface JournalEntry {
  ts: string;          // ISO 8601 UTC
  event: "command_start" | "file_change" | "stop";
  kit?: string;
  command?: string;
  file?: string;
  transcript?: string;
}

async function appendJournal(projectDir: string, entry: JournalEntry): Promise<void> {
  // Ensure .aika/ exists, append JSON line to journal.jsonl
}
```

---

## 9. Package Configuration

```jsonc
{
  "name": "@aikadev/aika",
  "version": "0.1.0",
  "description": "AI Kit Awareness — One project. Many kits. Zero conflicts. Full awareness.",
  "bin": { "aika": "dist/index.js" },
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "files": ["dist/", "schema/"],
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

TypeScript config: ES2022 target, ESM output, strict mode, outDir `dist/`.

---

## 10. Verification Plan

### Manual testing:

1. **Build:** `npm run build` — compiles without errors
2. **Init scaffold:** `node dist/index.js init` in a test project
   - Verify `.aika/hooks/` contains 4 .mjs files
   - Verify `.claude/settings.json` has all hook entries
   - Run init again → verify idempotent (no duplicate entries)
3. **Hook execution:** Simulate Claude Code hook by piping JSON to stdin:
   ```bash
   echo '{"prompt":"/gsd:execute-phase 3"}' | node .aika/hooks/on-prompt.mjs
   # Check .aika/journal.jsonl has command_start entry
   
   echo '{"tool_name":"Write","tool_input":{"file_path":"src/test.ts"}}' | node .aika/hooks/dispatcher.mjs
   # Check .aika/journal.jsonl has file_change entry
   
   echo '{"transcript_path":"test.jsonl","cwd":"."}' | node .aika/hooks/on-stop.mjs
   # Check .aika/journal.jsonl has stop entry
   ```
4. **Non-slash-command:** `echo '{"prompt":"hello"}' | node .aika/hooks/on-prompt.mjs` → no journal entry
5. **Graceful failure:** With no app running on :4242, hooks still exit 0, journal still written
6. **Settings merge:** Init with pre-existing hooks in settings.json → verify they're preserved

### Automated tests (future):

- Unit tests for shared.mjs functions
- Unit tests for settings merge logic (various existing configs)
- Integration test for full init flow

---

## 11. Out of Scope

- `aika detect` implementation (stub command only)
- `aika start` / `aika stop` (app manager — separate feature)
- MCP server implementation (lives in aika-app)
- Dashboard UI (lives in aika-app)
- Codebase-Memory integration (lives in aika-app)
- Slash command templates (`.claude/commands/aika/*.md`)
