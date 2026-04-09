import { appendJournal, postCapture, readStdinJson } from "./shared.mjs";

const input = await readStdinJson();
if (!input) process.exit(0);

const toolInput = input.tool_input ?? {};
const filePath = toolInput.file_path ?? toolInput.file ?? null;
if (!filePath) process.exit(0);

const ts = new Date().toISOString();
const cwd = input.cwd ?? process.env.AIKA_PROJECT_DIR ?? process.cwd();

await appendJournal(cwd, { ts, event: "file_change", file: filePath });
await postCapture({ type: "file_change", file: filePath, project: cwd });
