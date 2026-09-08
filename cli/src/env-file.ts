import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { CreateConfig } from "./config";
import { landedExtras, type ExtraManifest } from "./installers";

type EnvEntry = NonNullable<ExtraManifest["env"]>[number];

const BASE_SITE_URL: EnvEntry = {
  key: "NEXT_PUBLIC_SITE_URL",
  side: "client",
  zod: "z.url()",
  example: "http://localhost:3000",
};

function extraEnv(config: CreateConfig): EnvEntry[] {
  return landedExtras(config).flatMap((extra) => extra.manifest.env ?? []);
}

function renderFields(entries: Array<{ key: string; value: string }>): string {
  return entries.map((entry) => `    ${entry.key}: ${entry.value},`).join("\n");
}

export async function writeEnv(config: CreateConfig): Promise<void> {
  const extra = extraEnv(config);
  const server = [
    { key: "NODE_ENV", value: 'z.enum(["development", "test", "production"])' },
    ...extra
      .filter((entry) => entry.side === "server")
      .map((entry) => ({ key: entry.key, value: entry.zod })),
  ];
  const client = [
    { key: BASE_SITE_URL.key, value: BASE_SITE_URL.zod },
    ...extra
      .filter((entry) => entry.side === "client")
      .map((entry) => ({ key: entry.key, value: entry.zod })),
  ];
  const runtime = [...server, ...client].map(
    (entry) => `    ${entry.key}: process.env.${entry.key},`,
  );

  const envJs = `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
${renderFields(server)}
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * \`NEXT_PUBLIC_\`.
   */
  client: {
${renderFields(client)}
  },

  /**
   * You can't destruct \`process.env\` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
${runtime.join("\n")}
  },
  /**
   * Run \`build\` or \`dev\` with \`SKIP_ENV_VALIDATION\` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. \`SOME_VAR: z.string()\` and
   * \`SOME_VAR=''\` will throw an error.
   */
  emptyStringAsUndefined: true,
});
`;

  await writeFile(path.join(config.projectDir, "src/env.js"), envJs);

  const dotenv = [
    `${BASE_SITE_URL.key}=${BASE_SITE_URL.example}`,
    ...extra.map((entry) => `${entry.key}=${entry.example}`),
  ].join("\n");
  const dotenvText = `${dotenv}\n`;
  await writeFile(path.join(config.projectDir, ".env.example"), dotenvText);
  await writeFile(path.join(config.projectDir, ".env"), dotenvText);
}
