import type { CreateConfig } from "./config";
import type { Composition } from "./standards";

export const STACK_IDS = ["next-only", "inertia-monolith", "api-next"] as const;
export type StackId = (typeof STACK_IDS)[number];
type NextOnlyOption = "shell" | "data" | "db" | "intl" | "locale" | "resend";
type StackDefinition = {
  label: string;
  templateRoot: string;
  jsRoots: readonly string[];
  phpRoot: string | null;
  rejectedOptions: readonly NextOnlyOption[];
  setupEntryPoint: string;
};
const nextOnlyOptions = ["shell", "data", "db", "intl", "locale", "resend"] as const;

export const stacks: Record<StackId, StackDefinition> = {
  "next-only": {
    label: "Next.js only",
    templateRoot: "base",
    jsRoots: ["."],
    phpRoot: null,
    rejectedOptions: [],
    setupEntryPoint: "bun run setup",
  },
  "inertia-monolith": {
    label: "Laravel + Inertia + React",
    templateRoot: "stacks/inertia-monolith",
    jsRoots: ["."],
    phpRoot: ".",
    rejectedOptions: nextOnlyOptions,
    setupEntryPoint: "bun run setup",
  },
  "api-next": {
    label: "Laravel API + Next.js",
    templateRoot: "stacks/api-next",
    jsRoots: ["apps/web"],
    phpRoot: "services/api",
    rejectedOptions: nextOnlyOptions,
    setupEntryPoint: "bun run setup",
  },
};

/** U14's release lock catalog must use exactly these dependency-affecting choices. */
export function dependencyComposition(config: CreateConfig): Composition {
  if (config.stack !== "next-only") return { stack: config.stack };
  return {
    stack: config.stack,
    data: config.data,
    db: config.data === "drizzle" ? config.db : null,
    shadcn: config.shadcn,
    playwright: config.playwright,
    resend: config.resend,
    intl: config.intl,
  };
}
