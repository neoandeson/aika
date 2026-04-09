import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { removeAikaSettings } from "../scaffold/settings.js";

export async function runUninstall(projectDir: string): Promise<void> {
  const results: string[] = [];

  // 1. Remove Aika entries from .claude/settings.json
  const settingsChanged = await removeAikaSettings(projectDir);
  if (settingsChanged) {
    results.push("✓ Removed hooks from .claude/settings.json");
    results.push("✓ Removed MCP server from .claude/settings.json");
  }

  // 2. Remove .aika/ directory
  const aikaDir = join(projectDir, ".aika");
  if (existsSync(aikaDir)) {
    rmSync(aikaDir, { recursive: true, force: true });
    results.push("✓ Removed .aika/ directory");
  }

  if (results.length === 0) {
    console.log("Nothing to remove — Aika is not installed in this project.");
  } else {
    for (const line of results) {
      console.log(line);
    }
    console.log("  Aika has been cleanly removed from this project.");
  }
}
