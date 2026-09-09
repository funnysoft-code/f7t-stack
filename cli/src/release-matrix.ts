import type { FlagInput } from "./config";
import type { ReleaseManifest } from "./standards";
import { resolveConfig } from "./config";
import { compositionKey } from "./standards";
import { dependencyComposition, STACK_IDS } from "./stacks";

/** All normalized application choices, including choices that share a lock. */
export function generationMatrix(): FlagInput[] {
  const cases: FlagInput[] = [];
  for (const shell of ["site", "app"] as const)
    for (const data of ["none", "sanity", "sqlite", "postgres"] as const)
      for (const shadcn of [false, true])
        for (const playwright of [false, true])
          for (const resend of [false, true])
            for (const language of ["en", "pt-PT", "intl"] as const)
              cases.push({
                stack: "next-only",
                shell,
                data: data === "sqlite" || data === "postgres" ? "drizzle" : data,
                ...(data === "sqlite" || data === "postgres" ? { db: data } : {}),
                shadcn,
                playwright,
                resend,
                intl: language === "intl",
                locale: language === "intl" ? "en" : language,
              });
  for (const stack of STACK_IDS) if (stack !== "next-only") cases.push({ stack });
  return cases;
}

/** Catalog keys come from the registry, never a second composition-key implementation. */
export function dependencyMatrix(): Array<{ key: string; flags: FlagInput }> {
  return [
    ...new Map(
      generationMatrix().map((flags) => {
        const config = resolveConfig({ ...flags, appName: "matrix" });
        return [compositionKey(dependencyComposition(config)), flags] as const;
      }),
    ).entries(),
  ].map(([key, flags]) => ({ key, flags }));
}

export function verifyCompleteCatalog(release: ReleaseManifest): void {
  const expected = dependencyMatrix()
    .map(({ key }) => key)
    .sort();
  const actual = release.locks.map(({ key }) => key).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error("Incomplete supported composition catalog");
}
