import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync, appendFileSync } from "node:fs";
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
      env: { ...process.env, AIKA_PROJECT_DIR: testDir, AIKA_PORT: "19999" },
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

  it("generates .aika/context.md from journal", () => {
    runHook({ transcript_path: "test.jsonl", cwd: testDir });

    const contextPath = join(testDir, ".aika", "context.md");
    expect(existsSync(contextPath)).toBe(true);

    const content = readFileSync(contextPath, "utf-8");
    expect(content).toContain("# Aika Context");
    expect(content).toContain("Sessions:");
    expect(content).toContain("Transcript:");
  });

  it("context.md shows commands from prior hooks in same session", () => {
    // Simulate a session: command_start → file_change → stop
    const aikaDir = join(testDir, ".aika");
    mkdirSync(aikaDir, { recursive: true });
    const journalPath = join(aikaDir, "journal.jsonl");
    appendFileSync(journalPath, JSON.stringify({ ts: "2026-04-08T10:00:00Z", event: "command_start", kit: "gsd", command: "/gsd:execute-phase" }) + "\n");
    appendFileSync(journalPath, JSON.stringify({ ts: "2026-04-08T10:01:00Z", event: "file_change", file: "src/app.ts" }) + "\n");

    // Now on-stop fires, which appends stop + generates context
    runHook({ cwd: testDir });

    const content = readFileSync(join(testDir, ".aika", "context.md"), "utf-8");
    expect(content).toContain("/gsd:execute-phase");
    expect(content).toContain("src/app.ts");
    expect(content).toContain("gsd");
  });
});
