import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface JournalEntry {
  ts: string;
  event: "command_start" | "file_change" | "stop";
  kit?: string;
  command?: string;
  file?: string;
  transcript?: string;
}

export async function appendJournal(
  projectDir: string,
  entry: JournalEntry
): Promise<void> {
  try {
    const aikaDir = join(projectDir, ".aika");
    mkdirSync(aikaDir, { recursive: true });
    const journalPath = join(aikaDir, "journal.jsonl");
    appendFileSync(journalPath, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // Silent failure — hooks must never block Claude Code
  }
}
