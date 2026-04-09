import { appendJournal, postCapture, readStdinJson, updateContext } from "./shared.mjs";

const input = await readStdinJson();
if (!input) process.exit(0);

const ts = new Date().toISOString();
const cwd = input.cwd ?? process.env.AIKA_PROJECT_DIR ?? process.cwd();
const transcript = input.transcript_path ?? undefined;

const entry = { ts, event: "stop" };
if (transcript) entry.transcript = transcript;

await appendJournal(cwd, entry);
await postCapture({ type: "session_stop", transcript, project: cwd });
await updateContext(cwd);
