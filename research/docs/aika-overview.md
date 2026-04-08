# Aika — AI Kit Awareness

> One project. Many kits. Zero conflicts. Full awareness.

**npm:** `@aikadev/aika` · **Repos:** `neoandeson/aika` (public, MIT), `neoandeson/aika-app` (private)

---

## 1. What Aika Is

Aika is a desktop app + CLI that manages AI development kits (GSD, BMAD, gstack, OpenSpec, etc.) installed into Claude Code. It detects kits, catalogs their commands, lets users compose step-based workflows, tracks progress, and bundles code intelligence — all exposed via MCP.

**Aika IS:** Kit-aware orchestration layer + code intelligence provider.

**Aika is NOT:** A kit installer (each kit installs itself). NOT a code graph engine from scratch (bundles Codebase-Memory, MIT). NOT a chat UI. NOT an agent. NOT a database analyzer.

---

## 2. Why Aika Exists

### The Kit Conflict Problem

"Kits" = prompt frameworks (GSD, BMAD, gstack, OpenSpec). They are collections of markdown files (commands, agents, skills) living in `.claude/`. Each kit installs itself — GSD via `npx gsd install`, BMAD via `npx bmad install`, etc.

When multiple kits coexist: agent name collisions, hook overwrites, contradicting CLAUDE.md instructions, 60-80 commands loaded into context, no awareness of which kit did what or what's next.

No tool currently solves this. Developers manually cherry-pick files or use one kit at a time.

### The Token Waste Problem

AI tools re-scan codebase every question (50-100k tokens per query via grep+read). Pre-computed knowledge graph: ~500-2000 tokens per query, 99% reduction.

Solution: bundle Codebase-Memory (MIT, 66 languages, 14 MCP tools) — index once, query in milliseconds.

---

## 3. Architecture

```
┌─ aika-app (Wails desktop binary) ─────────────────────────────┐
│                                                                 │
│  Go Backend                        React Frontend              │
│  ├── Kit Engine                    ├── Catalog browser          │
│  │   ├── detect (.claude/ scan)    ├── Flow editor              │
│  │   ├── catalog (JSON read)       ├── Status view              │
│  │   ├── flow (steps)              ├── Journal timeline         │
│  │   ├── status / next             ├── Graph explorer           │
│  │   ├── journal (JSONL read)      └── Settings                │
│  │   └── resume                                                │
│  │                                                              │
│  ├── Code Intelligence                                         │
│  │   └── Codebase-Memory (MIT, bundled binary)                 │
│  │       ├── Managed as child process                          │
│  │       ├── Communicates via stdio MCP                        │
│  │       └── Own SQLite DB (~/.cache/codebase-memory-mcp/)     │
│  │                                                              │
│  ├── MCP Server (SSE at /mcp)                                  │
│  │   ├── Kit tools: aika_context, aika_status, aika_next, ...  │
│  │   └── Code tools: aika_trace, aika_search (via CBM)         │
│  │                                                              │
│  └── HTTP API (for hooks + MCP + external access)              │
│      └── POST /api/capture ← receives hook events              │
│                                                                 │
│  Data: JSON files only                                         │
│  ├── .aika/catalog.json    (~5-50KB)                           │
│  ├── .aika/flow.json       (~1-5KB)                            │
│  └── .aika/journal.jsonl   (~1MB/year)                         │
│  NO SQLite, NO PostgreSQL for Aika's own data                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        ▲ hooks (async, <50ms)          │ MCP (on-demand)
┌─ Project ──────────────────────────────────────────────────────┐
│  .claude/                                                      │
│  ├── settings.json      ← Aika registers 1 dispatcher hook    │
│  ├── commands/gsd/      ← GSD's own commands (self-installed)  │
│  ├── commands/bmad/     ← BMAD's own commands                  │
│  ├── commands/aika/     ← Aika meta-commands (generated)       │
│  └── agents/, skills/   ← from all kits                       │
│                                                                 │
│  .aika/                                                        │
│  ├── catalog.json       ← detected kits + commands             │
│  ├── flow.json          ← user-defined step sequence           │
│  ├── journal.jsonl      ← event log (what ran, when)           │
│  └── hooks/             ← 3 shell scripts                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Wails Desktop App

aika-app is a **Wails v2 desktop application** (Go backend + React frontend + system webview → single binary).

```
Build:
  wails build → 1 binary file
    Windows:  aika-app.exe  (~15-20MB)
    macOS:    Aika.app      (~15-20MB)
    Linux:    aika-app      (~15-20MB)

User experience:
  Download → double-click → native window opens → React dashboard inside
  No browser tab. No Go/Node/Docker install needed.
  System tray icon, minimize to tray, auto-start with OS.

Why Wails (not Electron, not browser):
  - Single binary, zero deps (vs Electron 150MB + Chromium)
  - Compiled Go binary — hard to reverse engineer (license protection)
  - Native system tray, menus, auto-update
  - Professional appearance (own app, not browser tab)
  - React calls Go functions directly via IPC (no REST API for UI)
  - Go skills transferable to backend jobs (~100 Go jobs in HCM)
```

---

## 5. Code Intelligence — Codebase-Memory Integration

Aika bundles Codebase-Memory (MIT license, by DeusData) as a child process.

```
Aika App manages:
  1. Download CBM binary on first run (~8MB)
  2. Start CBM as child process (stdio MCP)
  3. Health check / restart if needed
  4. Wrap CBM's 14 MCP tools → expose via Aika MCP
  5. Enrich CBM responses with kit context (current step, kit, journal)
  6. Stop CBM when Aika exits

CBM provides: code graph (66 languages), call chains, dependencies, search
CBM stores: own SQLite at ~/.cache/codebase-memory-mcp/
Aika adds: kit awareness, workflow context, combined aika_context tool
```

---

## 6. Data Storage — JSON Only

Aika stores NO data in databases. All Aika data is plain files:

```
.aika/catalog.json     JSON      ~5-50KB     Detected kits + commands
.aika/flow.json        JSON      ~1-5KB      User-defined steps
.aika/journal.jsonl    JSONL     ~1MB/year   Append-only event log

Total Aika data: <2MB for typical project after 1 year.
```

Why no SQLite for Aika:
- Data too small and simple for database
- JSON files = human-readable, git-friendly, easy to debug
- No complex queries needed (filter by kit/date = parse JSONL)
- Zero install, zero configuration

Codebase-Memory uses its own SQLite — Aika doesn't touch it. CBM manages its own data lifecycle independently.

PostgreSQL only needed if/when team features require shared state (separate architecture, future tier).

---

## 7. License Strategy

### Public Repo: `neoandeson/aika` — MIT

CLI + hooks + slash commands + catalog. Users audit every line.

### Private Repo: `neoandeson/aika-app` — Proprietary or BSL

Wails desktop binary. Compiled Go = hard to reverse engineer. License enforcement possible at app startup (check license key before showing UI).

BSL option: source visible, free for non-production, paid for commercial. After 3 years → MIT. Used by MongoDB, CockroachDB, Sentry.

### Bundled: Codebase-Memory — MIT (attributed)

Legal requirements:
```
✅ Include MIT license text + "Copyright (c) DeusData" in distribution
✅ That's all. MIT allows: bundle, sell, modify, keep Aika proprietary.
```

Distribution layout:
```
~/.aika/
├── bin/
│   ├── aika-app                    ← Aika binary (proprietary)
│   └── codebase-memory-mcp         ← CBM binary (MIT)
├── config.json                     ← Global settings
└── LICENSES/
    ├── AIKA-LICENSE                ← Aika's own license
    └── CODEBASE-MEMORY-MIT.txt    ← Required: MIT text + copyright
```

---

## 8. Feature Summary

### CORE (~2 weeks)

| # | Feature | Description |
|---|---|---|
| 1 | `aika detect` | Scan .claude/ → build catalog.json |
| 2 | `aika flow create` | Assign kits to steps, save flow.json |
| 3 | `aika status` / `aika next` | Current step + progress + next command |
| 4 | `aika journal` | Event log (which commands ran) |
| 5 | `aika resume` | Detect interrupted work |
| 6 | MCP server | Expose kit + code context to any AI tool |

### IMPORTANT (~2-3 weeks)

| # | Feature | Description |
|---|---|---|
| 7 | Codebase-Memory integration | Bundle, manage lifecycle, wrap MCP tools |
| 8 | `aika detect --url <repo>` | Fetch GitHub repo → add to catalog |
| 9 | Dashboard | Catalog + flow editor + status + graph explorer |
| 10 | `/aika:*` slash commands | Meta-commands for Claude Code |
| 11 | Flow validation | Warn if steps break kit internal chains |

### OPTIONAL (market-driven)

| # | Feature |
|---|---|
| 12 | Database analyzer plugin (MSSQL/PostgreSQL) |
| 13 | Report analyzer plugin (Crystal/SSRS) |
| 14 | Team features (shared state, claims) |
| 15 | Gate system |

### NOT DO

- Code AST parser from scratch (use Codebase-Memory)
- Chat UI
- Entity CRUD editor
- PostgreSQL/MySQL for Aika data
- Compete with Grapuco/Augment on breadth

---

## 9. Key Terms

| Term | Meaning |
|---|---|
| Kit | Prompt framework: GSD, BMAD, gstack, OpenSpec, custom |
| Step | Flow unit: 1 kit handles 1 purpose (not "phase" — phase implies sprint) |
| Flow | User-defined sequence of steps |
| Catalog | Auto-detected list of installed kits + their commands |
| Journal | Append-only event log (command_start, file_change, stop) |

---

## 10. Naming Convention

| Context | Name |
|---|---|
| Product | Aika (AI Kit Awareness) |
| npm | `@aikadev/aika` |
| CLI | `aika` |
| Desktop app | Aika (Wails binary) |
| Slash commands | `/aika:status`, `/aika:next` |
| MCP server | `aika` |
| MCP tools | `aika_status`, `aika_trace` |
| Project config | `.aika/` |
| Global data | `~/.aika/` |
