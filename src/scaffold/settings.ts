import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

function hasAikaEntry(entries: HookEntry[]): boolean {
  return entries.some((entry) =>
    entry.hooks.some((h) => h.command.includes(".aika/hooks/"))
  );
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
    settings.mcpServers.aika = { url: "http://localhost:4242/mcp" };
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}
