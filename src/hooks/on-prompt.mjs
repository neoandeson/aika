import { appendJournal, postCapture, readStdinJson } from "./shared.mjs";

const input = await readStdinJson();
if (!input) process.exit(0);

const prompt = input.prompt ?? "";
if (!prompt.startsWith("/")) process.exit(0);

// Extract command: "/gsd:execute-phase 3" → "/gsd:execute-phase"
const command = prompt.split(/\s/)[0];

// Extract kit: "/gsd:execute-phase" → "gsd", "/help" → "help"
const withoutSlash = command.slice(1);
const kit = withoutSlash.includes(":") ? withoutSlash.split(":")[0] : withoutSlash;

const ts = new Date().toISOString();
const cwd = input.cwd ?? process.env.AIKA_PROJECT_DIR ?? process.cwd();

await appendJournal(cwd, { ts, event: "command_start", kit, command });
await postCapture({ type: "command_start", kit, command, project: cwd });
