import { copyFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { CreateConfig } from "./config";
import { copyTemplateDir } from "./fs";
import { htmlLang, templateDir } from "./paths";

async function assertProjectDirReady(projectDir: string, force: boolean): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(projectDir);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return;
    }
    throw error;
  }
  if (entries.length > 0 && !force) {
    throw new Error(`Directory ${projectDir} is not empty`);
  }
}

export async function createApp(config: CreateConfig): Promise<void> {
  await assertProjectDirReady(config.projectDir, config.force);
  await mkdir(config.projectDir, { recursive: true });
  await copyTemplateDir(templateDir("base"), config.projectDir, {
    __F7T_APP_NAME__: config.appName,
    __F7T_LOCALE__: config.locale,
    __F7T_HTML_LANG__: htmlLang(config),
  });
  const envPath = path.join(config.projectDir, ".env");
  if (!existsSync(envPath)) {
    await copyFile(path.join(config.projectDir, ".env.example"), envPath);
  }
  // install/git not wired (Task 15)
}
