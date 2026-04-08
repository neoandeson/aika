# aika-app — Private Repo Specification

**Private (Proprietary/BSL) · Wails v2 Desktop App · Go + React → Single Binary**

> Click and run. Kit engine + code intelligence + MCP server + dashboard.

---

## 1. What This App Is

A **Wails v2 desktop application**: Go backend + React frontend compiled into a single binary (~15-20MB). User double-clicks → native window opens → dashboard ready. No browser, no Docker, no runtime dependencies.

```
aika-app.exe / Aika.app / aika-app
  ├── Go backend (kit engine + HTTP + MCP + CBM manager)
  ├── React frontend (embedded via go:embed)
  ├── System webview (OS-native, not Chromium)
  └── Codebase-Memory (child process, downloaded on first run)
```

Why Wails: compiled Go binary (hard to reverse engineer → license protection), single binary distribution, native system tray, ~15MB (vs Electron 150MB), Go skills transferable to backend jobs.

---

## 2. Architecture

```
aika-app binary
│
├── Kit Engine (reads JSON files, NO database)
│   ├── catalog.go       → read .aika/catalog.json
│   ├── flow.go          → read/update .aika/flow.json
│   ├── status.go        → compute current step + progress
│   ├── next.go          → suggest next command
│   ├── resume.go        → detect interrupted work from journal
│   ├── journal.go       → read .aika/journal.jsonl
│   └── capture.go       → handle incoming hook POST events
│
├── Code Intelligence
│   └── Codebase-Memory (MIT, bundled binary)
│       ├── manager.go   → download / start / stop / health-check
│       ├── mcp_client.go → call CBM's 14 MCP tools via stdio
│       └── Data: ~/.cache/codebase-memory-mcp/ (CBM's own SQLite)
│
├── HTTP Server (localhost:4242, for EXTERNAL callers only)
│   ├── POST /api/capture        ← hook events
│   └── /mcp                     ← MCP server (SSE)
│
├── Wails IPC Bindings (for INTERNAL React ↔ Go, no HTTP)
│   ├── KitEngine.GetStatus()
│   ├── KitEngine.GetCatalog()
│   ├── KitEngine.GetFlow() / UpdateFlow()
│   ├── KitEngine.GetJournal()
│   └── CodeIntel.Search() / Trace()
│
├── MCP Server (12 tools)
│   ├── Kit tools:  aika_context, aika_status, aika_next, aika_catalog,
│   │               aika_flow, aika_journal, aika_suggest
│   └── Code tools: aika_trace, aika_search, aika_architecture,
│                    aika_impact, aika_graph_query (via CBM)
│
└── React Dashboard (embedded)
    ├── Catalog browser
    ├── Flow editor (drag steps, assign kits)
    ├── Status view
    ├── Journal timeline
    ├── Graph explorer
    └── Settings

Data storage: JSON files ONLY
  .aika/catalog.json     ~5-50KB
  .aika/flow.json        ~1-5KB
  .aika/journal.jsonl    ~1MB/year
  NO SQLite, NO PostgreSQL for Aika data
  CBM uses own SQLite separately
```

Key distinction: React talks to Go via **Wails IPC** (direct function calls, fast). External callers (hooks, AI tools) talk via **HTTP/MCP** on :4242.

---

## 3. Repo Structure

```
aika-app/
├── main.go                          # Wails entry + HTTP server start
├── app.go                           # Wails config + bindings
├── engine/
│   ├── catalog.go, flow.go, status.go, next.go, resume.go, journal.go, capture.go
├── codeintel/
│   ├── manager.go, download.go, mcp_client.go
├── server/
│   ├── http.go                      # POST /api/capture
│   └── mcp.go                      # MCP server (SSE)
├── app/                             # React frontend
│   ├── src/pages/                   # Catalog, FlowEditor, Status, Journal, Graph, Settings
│   ├── src/hooks/                   # useCatalog, useFlow, useStatus, useJournal
│   ├── src/components/ui/           # shadcn/ui
│   ├── wailsjs/                     # Auto-generated Go↔JS bindings
│   └── vite.config.ts
├── build/                           # Platform-specific assets (icons, manifests)
├── LICENSES/
│   ├── AIKA-LICENSE
│   └── CODEBASE-MEMORY-MIT.txt
├── wails.json
├── go.mod
└── Makefile
```

---

## 4. Wails Entry Point

```go
package main

import (
    "embed"
    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:app/dist
var assets embed.FS

func main() {
    kit := NewKitEngine()
    code := NewCodeIntelligence()
    srv := NewHTTPServer(kit, code)

    go srv.Start(":4242")   // HTTP for hooks + MCP
    go code.Start()          // Codebase-Memory child process

    wails.Run(&options.App{
        Title:  "Aika",
        Width:  1280,
        Height: 800,
        AssetServer: &assetserver.Options{Assets: assets},
        Bind:   []interface{}{kit, code},
        OnShutdown: func(ctx context.Context) {
            code.Stop()
            srv.Stop()
        },
    })
}
```

---

## 5. aika_context — The Killer MCP Tool

Returns FULL project awareness in 1 call (~2000 tokens):

```go
func handleAikaContext(project string) map[string]interface{} {
    catalog, _ := kit.GetCatalog(project)
    flow, _ := kit.GetFlow(project)
    journal, _ := kit.GetJournal(project, 10)
    next := kit.ComputeNext(flow, journal)
    arch, _ := code.CallTool("get_architecture", project)

    return map[string]interface{}{
        "kits_installed": catalogNames(catalog),
        "flow": flowSummary(flow),
        "next_action": next,
        "recent_commands": journalSummary(journal),
        "architecture": arch,   // from Codebase-Memory
    }
}
```

---

## 6. Build + Distribution

```bash
wails dev                              # Dev: hot reload Go + React
wails build                            # Build: current platform
wails build -platform windows/amd64    # Cross: aika-app.exe
wails build -platform darwin/arm64     # Cross: Aika.app
wails build -platform linux/amd64      # Cross: aika-app
```

User flow:
```
npm install -g @aikadev/aika    ← CLI (public repo)
aika start                      ← downloads aika-app + CBM binaries
  → Desktop window opens        ← ready
cd my-project && aika init      ← hooks + MCP registered
```

---

## 7. Tech Stack

| Component | Technology |
|---|---|
| Desktop | Wails v2 |
| Backend | Go |
| Frontend | Vite + React 18 + shadcn/ui + Tailwind |
| Graph viz | React Flow |
| UI↔Backend | Wails IPC bindings (direct Go function calls) |
| External API | net/http (hooks + MCP at :4242) |
| MCP | Go MCP library |
| Code intel | Codebase-Memory (MIT, bundled, child process) |
| Data | JSON files only |

---

## 8. Implementation Priority

| Week | Goal | Deliverables |
|---|---|---|
| 1-2 | Wails + Kit Engine | Scaffold, catalog/flow/status/next/resume, Go↔React bindings |
| 3 | MCP Server | 7 kit tools + capture endpoint |
| 4 | CBM Integration | Download, lifecycle, MCP client, 5 code tools, aika_context |
| 5-6 | Dashboard | Catalog, flow editor, status, journal, graph explorer |
| 7 | Polish | System tray, cross-platform builds, testing, docs |

**Total: ~7 weeks** (including Go learning curve).
