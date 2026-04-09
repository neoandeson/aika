import { cpSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOOK_FILES = ["on-prompt.mjs", "dispatcher.mjs", "on-stop.mjs", "shared.mjs"];

function getHooksSourceDir(): string {
  // In dist: dist/scaffold/files.js → dist/hooks/
  // In src (dev): src/scaffold/files.ts → src/hooks/
  const hooksDir = join(__dirname, "..", "hooks");
  if (existsSync(hooksDir)) return hooksDir;
  throw new Error(`Hook source directory not found: ${hooksDir}`);
}

export async function scaffoldHookFiles(projectDir: string): Promise<void> {
  const sourceDir = getHooksSourceDir();
  const targetDir = join(projectDir, ".aika", "hooks");
  mkdirSync(targetDir, { recursive: true });

  for (const file of HOOK_FILES) {
    cpSync(join(sourceDir, file), join(targetDir, file));
  }

  const catalogPath = join(projectDir, ".aika", "catalog.json");
  if (!existsSync(catalogPath)) {
    writeFileSync(catalogPath, "{}\n", "utf-8");
  }
}
