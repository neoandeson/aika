import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const AIKA_PORT = parseInt(process.env.AIKA_PORT, 10) || 4242;
const CAPTURE_URL = `http://localhost:${AIKA_PORT}/api/capture`;
const TIMEOUT_MS = 2000;

/**
 * Append a journal entry to .aika/journal.jsonl.
 * Creates .aika/ directory if missing. Never throws.
 */
export async function appendJournal(cwd, entry) {
  try {
    const aikaDir = join(cwd, ".aika");
    mkdirSync(aikaDir, { recursive: true });
    const journalPath = join(aikaDir, "journal.jsonl");
    appendFileSync(journalPath, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // Silent — hooks must never block Claude Code
  }
}

/**
 * POST a capture event to the Aika desktop app.
 * Fire-and-forget with 2s timeout. Never throws.
 */
export async function postCapture(payload) {
  try {
    await fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Silent — app may not be running
  }
}

/**
 * Read all of stdin as a string and parse as JSON.
 * Returns null if stdin is empty or invalid JSON.
 */
export async function readStdinJson() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
