import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

describe("dispatcher hook", () => {
  let testDir;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-dispatch-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function runHook(input) {
    const hookPath = join(process.cwd(), "src", "hooks", "dispatcher.mjs");
    execSync(`node "${hookPath}"`, {
      cwd: testDir,
      timeout: 5000,
      input: JSON.stringify(input),
      env: { ...process.env, AIKA_PROJECT_DIR: testDir },
    });
  }

  it("tracks file_path from Write tool", () => {
    runHook({ tool_name: "Write", tool_input: { file_path: "src/main.ts" } });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const entry = JSON.parse(readFileSync(journalPath, "utf-8").trim());
    expect(entry.event).toBe("file_change");
    expect(entry.file).toBe("src/main.ts");
    expect(entry.ts).toBeDefined();
  });

  it("tracks file from Edit tool using file_path field", () => {
    runHook({ tool_name: "Edit", tool_input: { file_path: "src/utils.ts" } });

    const entry = JSON.parse(readFileSync(join(testDir, ".aika", "journal.jsonl"), "utf-8").trim());
    expect(entry.file).toBe("src/utils.ts");
  });

  it("ignores events without file_path", () => {
    runHook({ tool_name: "Bash", tool_input: { command: "ls" } });

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(false);
  });
});
