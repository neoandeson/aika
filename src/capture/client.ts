import { getCaptureUrl } from "../config.js";

const TIMEOUT_MS = 2000;

export interface CaptureEvent {
  type: "command_start" | "file_change" | "session_stop";
  project: string;
  kit?: string;
  command?: string;
  file?: string;
  transcript?: string;
}

export async function postCapture(event: CaptureEvent): Promise<void> {
  try {
    await fetch(getCaptureUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Silent failure — app may not be running
  }
}
