import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const srcHooks = join(root, "src", "hooks");

if (!existsSync(srcHooks)) {
  console.log("copy-hooks: src/hooks/ does not exist yet, skipping.");
  process.exit(0);
}

mkdirSync(join(root, "dist", "hooks"), { recursive: true });
cpSync(srcHooks, join(root, "dist", "hooks"), {
  recursive: true,
  filter: (src) => src.endsWith(".mjs") || !src.includes("."),
});

console.log("copy-hooks: done.");
