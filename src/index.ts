#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runUninstall } from "./commands/uninstall.js";
import { getPort } from "./config.js";

const program = new Command();

program
  .name("aika")
  .description(
    "AI Kit Awareness — One project. Many kits. Zero conflicts.\n\n" +
    "  Aika hooks capture Claude Code activity (slash commands, file changes,\n" +
    "  session ends) into a local journal and forward events to the Aika desktop app.\n\n" +
    "  This package (aika-hook) provides the CLI and hooks.\n" +
    "  For the full GUI dashboard, install aika-app: https://github.com/neoandeson/aika-app"
  )
  .version("0.1.2");

program
  .command("init")
  .description("Initialize Aika in the current project — scaffold hooks and register in settings")
  .action(async () => {
    const projectDir = process.cwd();
    try {
      await runInit(projectDir);
      console.log("");
      console.log("  Aika initialized successfully!");
      console.log("");
      console.log("  Hooks installed:");
      console.log("    ✓ on-prompt.mjs  — tracks slash commands (/gsd:*, /bmad:*, etc.)");
      console.log("    ✓ dispatcher.mjs — tracks file changes (Write, Edit, Bash)");
      console.log("    ✓ on-stop.mjs    — logs session end + generates context summary");
      console.log("");
      console.log("  Configuration:");
      console.log("    ✓ Hooks registered in .claude/settings.json");
      console.log(`    ✓ MCP server: aika → localhost:${getPort()}`);
      console.log("");
      console.log("  What's next:");
      console.log("    • Hooks are active — Claude Code activity is now tracked in .aika/journal.jsonl");
      console.log("    • Session summaries auto-generate in .aika/context.md on session end");
      console.log("    • For the GUI dashboard, install aika-app:");
      console.log("      https://github.com/neoandeson/aika-app");
      console.log("");
    } catch (err) {
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

program
  .command("uninstall")
  .description("Remove Aika from the current project — clean up hooks, settings, and data")
  .action(async () => {
    const projectDir = process.cwd();
    try {
      await runUninstall(projectDir);
    } catch (err) {
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
