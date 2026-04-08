import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

describe("on-stop hook", () => {
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-stop-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function runHook(input) {
    const hookPath = join(process.cwd(), "src", "hooks", "on-stop.mjs");
    execSync(`node "${hookPath}"`, {
      cwd: testDir,
      timeout: 5000,
      input: JSON.stringify(input),
      env: { ...process.env, AIKA_PROJECT_DIR: testDir },
    });
  }

  it("writes stop event with transcript path", () => {
    runHook({ transcript_path: "~/.claude/projects/abc.jsonl", cwd: testDir });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const entry = JSON.parse(readFileSync(journalPath, "utf-8").trim());
    expect(entry.event).toBe("stop");
    expect(entry.transcript).toBe("~/.claude/projects/abc.jsonl");
    expect(entry.ts).toBeDefined();
  });

  it("works without transcript_path", () => {
    runHook({});

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const entry = JSON.parse(readFileSync(journalPath, "utf-8").trim());
    expect(entry.event).toBe("stop");
    expect(entry.transcript).toBeUndefined();
  });
});
