import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runInit } from "./init.js";
import { runUninstall } from "./uninstall.js";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("aika uninstall", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-uninstall-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("fully removes Aika after init", async () => {
    await runInit(testDir);

    // Verify installed
    expect(existsSync(join(testDir, ".aika", "hooks", "on-prompt.mjs"))).toBe(true);
    expect(existsSync(join(testDir, ".claude", "settings.json"))).toBe(true);

    await runUninstall(testDir);

    // .aika/ gone
    expect(existsSync(join(testDir, ".aika"))).toBe(false);

    // settings.json still exists but Aika entries gone
    const settings = JSON.parse(
      readFileSync(join(testDir, ".claude", "settings.json"), "utf-8")
    );
    expect(settings.hooks).toBeUndefined();
    expect(settings.mcpServers).toBeUndefined();
  });

  it("preserves other kits' entries", async () => {
    // Set up existing hooks from another kit
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [
            { matcher: "Bash", hooks: [{ type: "command", command: "gsd-hook.sh" }] },
          ],
        },
        mcpServers: {
          gstack: { url: "http://localhost:9999/mcp" },
        },
      }),
      "utf-8"
    );

    // Init Aika on top, then uninstall
    await runInit(testDir);
    await runUninstall(testDir);

    const settings = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf-8"));
    // GSD hook preserved
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe("gsd-hook.sh");
    // gstack MCP preserved
    expect(settings.mcpServers.gstack).toBeDefined();
    expect(settings.mcpServers.aika).toBeUndefined();
  });

  it("handles uninstall when not installed", async () => {
    // Should not throw
    await expect(runUninstall(testDir)).resolves.toBeUndefined();
  });
});
