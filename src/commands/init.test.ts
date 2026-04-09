import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runInit } from "./init.js";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("aika init", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-init-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("scaffolds .aika/ and .claude/settings.json", async () => {
    await runInit(testDir);

    // Hook files exist
    expect(existsSync(join(testDir, ".aika", "hooks", "on-prompt.mjs"))).toBe(true);
    expect(existsSync(join(testDir, ".aika", "hooks", "dispatcher.mjs"))).toBe(true);
    expect(existsSync(join(testDir, ".aika", "hooks", "on-stop.mjs"))).toBe(true);
    expect(existsSync(join(testDir, ".aika", "hooks", "shared.mjs"))).toBe(true);

    // Catalog placeholder exists
    expect(existsSync(join(testDir, ".aika", "catalog.json"))).toBe(true);

    // Settings merged
    const settings = JSON.parse(
      readFileSync(join(testDir, ".claude", "settings.json"), "utf-8")
    );
    expect(settings.hooks.UserPromptSubmit).toHaveLength(1);
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.Stop).toHaveLength(1);
    expect(settings.hooks.SubagentStop).toHaveLength(1);
    expect(settings.mcpServers.aika).toBeDefined();
  });

  it("is idempotent", async () => {
    await runInit(testDir);
    await runInit(testDir);

    const settings = JSON.parse(
      readFileSync(join(testDir, ".claude", "settings.json"), "utf-8")
    );
    expect(settings.hooks.PostToolUse).toHaveLength(1);
  });
});
