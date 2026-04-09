import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

describe("on-prompt hook", () => {
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-prompt-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function runHook(input) {
    const hookPath = join(process.cwd(), "src", "hooks", "on-prompt.mjs");
    execSync(`node "${hookPath}"`, {
      cwd: testDir,
      timeout: 5000,
      input: JSON.stringify(input),
      env: { ...process.env, AIKA_PROJECT_DIR: testDir },
    });
  }

  it("writes command_start for slash commands", () => {
    runHook({ prompt: "/gsd:execute-phase 3" });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const entry = JSON.parse(readFileSync(journalPath, "utf-8").trim());
    expect(entry.event).toBe("command_start");
    expect(entry.kit).toBe("gsd");
    expect(entry.command).toBe("/gsd:execute-phase");
    expect(entry.ts).toBeDefined();
  });

  it("ignores non-slash-command prompts", () => {
    runHook({ prompt: "hello world" });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(false);
  });

  it("handles commands without kit prefix", () => {
    runHook({ prompt: "/help" });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const entry = JSON.parse(readFileSync(journalPath, "utf-8").trim());
    expect(entry.event).toBe("command_start");
    expect(entry.kit).toBe("help");
    expect(entry.command).toBe("/help");
  });
});
