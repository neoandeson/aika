import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { appendJournal } from "./writer.js";
import { mkdirSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("appendJournal", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates .aika/ dir and journal.jsonl if missing", async () => {
    const entry = {
      ts: "2026-04-08T10:00:00Z",
      event: "command_start" as const,
      kit: "gsd",
      command: "/gsd:execute-phase",
    };

    await appendJournal(testDir, entry);

    const journalPath = join(testDir, ".aika", "journal.jsonl");
    expect(existsSync(journalPath)).toBe(true);

    const content = readFileSync(journalPath, "utf-8").trim();
    const parsed = JSON.parse(content);
    expect(parsed).toEqual(entry);
  });

  it("appends multiple entries as separate lines", async () => {
    const entry1 = { ts: "2026-04-08T10:00:00Z", event: "command_start" as const, kit: "gsd", command: "/gsd:init" };
    const entry2 = { ts: "2026-04-08T10:01:00Z", event: "file_change" as const, file: "src/main.ts" };

    await appendJournal(testDir, entry1);
    await appendJournal(testDir, entry2);

    const content = readFileSync(join(testDir, ".aika", "journal.jsonl"), "utf-8").trim();
    const lines = content.split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual(entry1);
    expect(JSON.parse(lines[1])).toEqual(entry2);
  });

  it("does not throw on write errors", async () => {
    // Pass a path that can't be created (deeply nested in a file, not a dir)
    await expect(appendJournal("/dev/null/impossible/path", {
      ts: "2026-04-08T10:00:00Z",
      event: "stop" as const,
    })).resolves.toBeUndefined();
  });
});
