import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mergeAikaSettings, removeAikaSettings } from "./settings.js";
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("mergeAikaSettings", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-settings-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates .claude/settings.json from scratch", async () => {
    await mergeAikaSettings(testDir);

    const settingsPath = join(testDir, ".claude", "settings.json");
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(settings.hooks.UserPromptSubmit).toHaveLength(1);
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.Stop).toHaveLength(1);
    expect(settings.hooks.SubagentStop).toHaveLength(1);
    expect(settings.mcpServers.aika.url).toContain("/mcp");
  });

  it("preserves existing hooks when merging", async () => {
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [
            { matcher: "Bash", hooks: [{ type: "command", command: "other-hook.sh" }] },
          ],
        },
      }),
      "utf-8"
    );

    await mergeAikaSettings(testDir);

    const settings = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf-8"));
    // Existing entry preserved + Aika entry added
    expect(settings.hooks.PostToolUse).toHaveLength(2);
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe("other-hook.sh");
    expect(settings.hooks.PostToolUse[1].hooks[0].command).toContain(".aika/hooks/dispatcher.mjs");
  });

  it("is idempotent — does not duplicate on second run", async () => {
    await mergeAikaSettings(testDir);
    await mergeAikaSettings(testDir);

    const settings = JSON.parse(
      readFileSync(join(testDir, ".claude", "settings.json"), "utf-8")
    );
    expect(settings.hooks.UserPromptSubmit).toHaveLength(1);
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.Stop).toHaveLength(1);
    expect(settings.hooks.SubagentStop).toHaveLength(1);
  });
});

describe("removeAikaSettings", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-settings-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("removes all Aika hooks and MCP server", async () => {
    await mergeAikaSettings(testDir);
    const changed = await removeAikaSettings(testDir);

    expect(changed).toBe(true);
    const settings = JSON.parse(
      readFileSync(join(testDir, ".claude", "settings.json"), "utf-8")
    );
    expect(settings.hooks).toBeUndefined();
    expect(settings.mcpServers).toBeUndefined();
  });

  it("preserves other kits' hooks", async () => {
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({
        hooks: {
          PostToolUse: [
            { matcher: "Bash", hooks: [{ type: "command", command: "other-hook.sh" }] },
          ],
        },
        mcpServers: {
          other: { url: "http://localhost:9999/mcp" },
        },
      }),
      "utf-8"
    );

    // Add Aika, then remove it
    await mergeAikaSettings(testDir);
    await removeAikaSettings(testDir);

    const settings = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf-8"));
    // Other kit's hook preserved
    expect(settings.hooks.PostToolUse).toHaveLength(1);
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toBe("other-hook.sh");
    // Other MCP server preserved, Aika gone
    expect(settings.mcpServers.other).toBeDefined();
    expect(settings.mcpServers.aika).toBeUndefined();
  });

  it("returns false when no settings.json exists", async () => {
    const changed = await removeAikaSettings(testDir);
    expect(changed).toBe(false);
  });

  it("returns false when no Aika entries exist", async () => {
    const claudeDir = join(testDir, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({ hooks: { PostToolUse: [{ hooks: [{ type: "command", command: "other.sh" }] }] } }),
      "utf-8"
    );

    const changed = await removeAikaSettings(testDir);
    expect(changed).toBe(false);
  });
});
