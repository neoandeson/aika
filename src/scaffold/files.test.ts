import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { scaffoldHookFiles } from "./files.js";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("scaffoldHookFiles", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aika-scaffold-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("copies all 4 hook files to .aika/hooks/", async () => {
    await scaffoldHookFiles(testDir);

    const hooksDir = join(testDir, ".aika", "hooks");
    expect(existsSync(join(hooksDir, "on-prompt.mjs"))).toBe(true);
    expect(existsSync(join(hooksDir, "dispatcher.mjs"))).toBe(true);
    expect(existsSync(join(hooksDir, "on-stop.mjs"))).toBe(true);
    expect(existsSync(join(hooksDir, "shared.mjs"))).toBe(true);
  });

  it("creates empty catalog.json", async () => {
    await scaffoldHookFiles(testDir);

    const catalogPath = join(testDir, ".aika", "catalog.json");
    expect(existsSync(catalogPath)).toBe(true);
    expect(JSON.parse(readFileSync(catalogPath, "utf-8"))).toEqual({});
  });

  it("is idempotent — overwrites existing hook files", async () => {
    await scaffoldHookFiles(testDir);
    await scaffoldHookFiles(testDir);

    const hooksDir = join(testDir, ".aika", "hooks");
    expect(existsSync(join(hooksDir, "on-prompt.mjs"))).toBe(true);
  });
});
