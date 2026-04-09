import { scaffoldHookFiles } from "../scaffold/files.js";
import { mergeAikaSettings } from "../scaffold/settings.js";

export async function runInit(projectDir: string): Promise<void> {
  await scaffoldHookFiles(projectDir);
  await mergeAikaSettings(projectDir);
}
