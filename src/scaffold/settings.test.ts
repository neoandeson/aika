import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mergeAikaSettings } from "./settings.js";
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
