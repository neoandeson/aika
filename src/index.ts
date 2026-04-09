#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runUninstall } from "./commands/uninstall.js";
import { getPort } from "./config.js";

const program = new Command();

program
  .name("aika")
  .description("AI Kit Awareness — One project. Many kits. Zero conflicts.")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize Aika in the current project — scaffold hooks and register in settings")
  .action(async () => {
    const projectDir = process.cwd();
    try {
      await runInit(projectDir);
      console.log("✓ Created .aika/hooks/ (4 files)");
      console.log("✓ Registered hooks in .claude/settings.json");
      console.log(`✓ Registered MCP server: aika → localhost:${getPort()}`);
      console.log('  Run "aika start" to launch the desktop app.');
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
