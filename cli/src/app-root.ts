import type { CreateConfig } from "./config";

export function appPagesRoot(config: CreateConfig): string {
  return config.intl ? "src/app/[locale]" : "src/app";
}
