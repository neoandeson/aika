import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
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
 * Update .aika/context.md from journal.jsonl.
 * Summarizes the last session: commands run, files touched, timestamp.
 * Never throws.
 */
export async function updateContext(cwd) {
  try {
    const aikaDir = join(cwd, ".aika");
    const journalPath = join(aikaDir, "journal.jsonl");
    const contextPath = join(aikaDir, "context.md");

    if (!existsSync(journalPath)) return;

    const lines = readFileSync(journalPath, "utf-8").trim().split("\n").filter(Boolean);
    const entries = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    // Find sessions: split by "stop" events
    const sessions = [];
    let current = [];
    for (const entry of entries) {
      current.push(entry);
      if (entry.event === "stop") {
        sessions.push(current);
        current = [];
      }
    }
    if (current.length > 0) sessions.push(current);

    // Last session summary
    const lastSession = sessions[sessions.length - 1] || [];
    const commands = lastSession.filter((e) => e.event === "command_start");
    const files = lastSession.filter((e) => e.event === "file_change");
    const lastStop = lastSession.find((e) => e.event === "stop");

    // All-time stats
    const allCommands = entries.filter((e) => e.event === "command_start");
    const allFiles = entries.filter((e) => e.event === "file_change");
    const allSessions = entries.filter((e) => e.event === "stop").length;
    const kitsUsed = [...new Set(allCommands.map((e) => e.kit).filter(Boolean))];
    const uniqueFiles = [...new Set(allFiles.map((e) => e.file).filter(Boolean))];

    const now = new Date().toISOString().split("T")[0];

    let md = `# Aika Context\n\n`;
    md += `> Auto-generated from journal.jsonl on session end. Do not edit manually.\n\n`;
    md += `## Last Updated\n${now}\n\n`;

    md += `## Last Session\n`;
    if (commands.length > 0) {
      md += `**Commands run:**\n`;
      for (const c of commands) {
        md += `- \`${c.command}\` (${c.kit})\n`;
      }
    } else {
      md += `No slash commands recorded.\n`;
    }
    md += `\n`;

    if (files.length > 0) {
      const uniqueSessionFiles = [...new Set(files.map((e) => e.file))];
      md += `**Files touched:** ${uniqueSessionFiles.length}\n`;
      for (const f of uniqueSessionFiles.slice(0, 20)) {
        md += `- \`${f}\`\n`;
      }
      if (uniqueSessionFiles.length > 20) {
        md += `- ... and ${uniqueSessionFiles.length - 20} more\n`;
      }
    }
    md += `\n`;

    if (lastStop?.transcript) {
      md += `**Transcript:** \`${lastStop.transcript}\`\n\n`;
    }

    md += `## Stats\n`;
    md += `- **Sessions:** ${allSessions}\n`;
    md += `- **Total commands:** ${allCommands.length}\n`;
    md += `- **Total files touched:** ${uniqueFiles.length}\n`;
    if (kitsUsed.length > 0) {
      md += `- **Kits used:** ${kitsUsed.join(", ")}\n`;
    }

    writeFileSync(contextPath, md, "utf-8");
  } catch {
    // Silent — must never block Claude Code
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
