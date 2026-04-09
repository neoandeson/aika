import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getMcpUrl } from "../config.js";

interface HookEntry {
  matcher?: string;
  hooks: Array<{ type: string; command: string }>;
}

interface Settings {
  hooks?: Record<string, HookEntry[]>;
  mcpServers?: Record<string, { url: string }>;
  [key: string]: unknown;
}

const AIKA_HOOKS: Record<string, HookEntry> = {
  UserPromptSubmit: {
    hooks: [{ type: "command", command: "node .aika/hooks/on-prompt.mjs" }],
  },
  PostToolUse: {
    matcher: "Write|Edit|MultiEdit|Bash",
    hooks: [{ type: "command", command: "node .aika/hooks/dispatcher.mjs" }],
  },
  Stop: {
    hooks: [{ type: "command", command: "node .aika/hooks/on-stop.mjs" }],
  },
  SubagentStop: {
    hooks: [{ type: "command", command: "node .aika/hooks/on-stop.mjs" }],
  },
};

function isAikaHook(h: { command: string }): boolean {
  return h.command.includes(".aika/hooks/");
}

function hasAikaEntry(entries: HookEntry[]): boolean {
  return entries.some((entry) => entry.hooks.some(isAikaHook));
}

export async function mergeAikaSettings(projectDir: string): Promise<void> {
  const claudeDir = join(projectDir, ".claude");
  const settingsPath = join(claudeDir, "settings.json");

  mkdirSync(claudeDir, { recursive: true });

  let settings: Settings = {};
  if (existsSync(settingsPath)) {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  }

  if (!settings.hooks) settings.hooks = {};

  for (const [category, entry] of Object.entries(AIKA_HOOKS)) {
    if (!settings.hooks[category]) {
      settings.hooks[category] = [];
    }
    if (!hasAikaEntry(settings.hooks[category])) {
      settings.hooks[category].push(entry);
    }
  }

  if (!settings.mcpServers) settings.mcpServers = {};
  if (!settings.mcpServers.aika) {
    settings.mcpServers.aika = { url: getMcpUrl() };
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

export async function removeAikaSettings(projectDir: string): Promise<boolean> {
  const settingsPath = join(projectDir, ".claude", "settings.json");
  if (!existsSync(settingsPath)) return false;

  const settings: Settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  let changed = false;

  // Remove Aika hooks — filter at hook level, not entry level
  if (settings.hooks) {
    for (const category of Object.keys(settings.hooks)) {
      const entries = settings.hooks[category];
      const filtered = entries
        .map((entry) => {
          const kept = entry.hooks.filter((h) => !isAikaHook(h));
          if (kept.length === entry.hooks.length) return entry;
          changed = true;
          if (kept.length === 0) return null;
          return { ...entry, hooks: kept };
        })
        .filter(Boolean) as HookEntry[];

      if (filtered.length === 0) {
        delete settings.hooks[category];
      } else {
        settings.hooks[category] = filtered;
      }
    }
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }
  }

  // Remove Aika MCP server
  if (settings.mcpServers?.aika) {
    delete settings.mcpServers.aika;
    changed = true;
    if (Object.keys(settings.mcpServers).length === 0) {
      delete settings.mcpServers;
    }
  }

  if (changed) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  }

  return changed;
}
