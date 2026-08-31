import { cancel, confirm, intro, isCancel, select, text } from "@clack/prompts";
import type { Data, Db, FlagInput, Harness, Locale, Shell } from "./config";

function abortIfCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  return value;
}

export async function runWizard(input: FlagInput): Promise<FlagInput> {
  intro("create-f7t-app");

  const appName =
    input.appName ??
    abortIfCancel(
      await text({
        message: "App name",
        placeholder: "my-app",
        validate: (value) => {
          if (!value?.trim()) {
            return "App name is required";
          }
        },
      }),
    ).trim();

  const shell =
    input.shell ??
    abortIfCancel(
      await select({
        message: "Shell",
        options: [
          { value: "site" as const, label: "Site" },
          { value: "app" as const, label: "App" },
        ],
        initialValue: "site" as Shell,
      }),
    );

  const data =
    input.data ??
    abortIfCancel(
      await select({
        message: "Data",
        options: [
          { value: "none" as const, label: "None" },
          { value: "sanity" as const, label: "Sanity" },
          { value: "drizzle" as const, label: "Drizzle" },
        ],
        initialValue: "none" as Data,
      }),
    );

  let db = input.db;
  if (data === "drizzle" && db === undefined) {
    db = abortIfCancel(
      await select({
        message: "Database",
        options: [
          { value: "sqlite" as const, label: "SQLite" },
          { value: "postgres" as const, label: "Postgres" },
        ],
        initialValue: "sqlite" as Db,
      }),
    );
  }

  const shadcn =
    input.shadcn ?? abortIfCancel(await confirm({ message: "ShadCN", initialValue: false }));

  const playwright =
    input.playwright ??
    abortIfCancel(await confirm({ message: "Playwright", initialValue: false }));

  const resend =
    input.resend ??
    abortIfCancel(await confirm({ message: "Resend contact form", initialValue: false }));

  const intl =
    input.intl ?? abortIfCancel(await confirm({ message: "next-intl", initialValue: false }));

  let locale = input.locale;
  if (!intl && locale === undefined) {
    locale = abortIfCancel(
      await select({
        message: "Locale",
        options: [
          { value: "en" as const, label: "en" },
          { value: "pt-PT" as const, label: "pt-PT" },
        ],
        initialValue: "pt-PT" as Locale,
      }),
    );
  }
  if (intl) {
    locale = "en";
  }

  const harness =
    input.harness ??
    abortIfCancel(
      await select({
        message: "Harness",
        options: [
          { value: "none" as const, label: "None" },
          { value: "grok" as const, label: "Grok" },
          { value: "cursor" as const, label: "Cursor" },
          { value: "both" as const, label: "Both" },
        ],
        initialValue: "none" as Harness,
      }),
    );

  const githubActions =
    input.githubActions ??
    abortIfCancel(await confirm({ message: "GitHub Actions", initialValue: true }));

  const git =
    input.git ?? abortIfCancel(await confirm({ message: "Git init", initialValue: true }));

  return {
    ...input,
    appName,
    shell,
    data,
    db,
    shadcn,
    playwright,
    resend,
    intl,
    locale,
    harness,
    githubActions,
    git,
  };
}
