import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { stacks, STACK_IDS } from "./stacks";
import { dependencyDigest } from "./standards";

const read = (file: string) => readFileSync(path.resolve("template", file), "utf8");
const json = (file: string) => JSON.parse(read(file));

test.each(STACK_IDS)("%s declares installed quality tools before installation", (stack) => {
  const root = stacks[stack].templateRoot;
  const pkg = json(`${root}/package.json`);
  for (const tool of [
    "typescript",
    "vitest",
    "@vitest/coverage-v8",
    "react-doctor",
    "lefthook",
    "@playwright/test",
  ]) {
    expect(pkg.devDependencies[tool], tool).toMatch(/^\d+\.\d+\.\d+/);
    const changed = structuredClone(pkg);
    delete changed.devDependencies[tool];
    expect(dependencyDigest(changed)).not.toBe(dependencyDigest(pkg));
  }
  expect(pkg.devDependencies.vitest).toBe(pkg.devDependencies["@vitest/coverage-v8"]);
  expect(pkg.scripts.check).toContain("bun run doctor");
  for (const gate of ["lint", "typecheck", "test", "doctor"]) {
    expect(pkg.scripts[gate]).toBe(`bash scripts/frontend-gate.sh ${gate}`);
  }
  expect(JSON.stringify(pkg.scripts)).not.toContain("bunx");
  expect(pkg.devDependencies[stack === "inertia-monolith" ? "vite-plus" : "oxlint"]).toBeTruthy();
  const coverage = read(`${root}/vitest.config.ts`);
  expect(coverage).toContain("lines: 100");
  expect(coverage).not.toContain("passWithNoTests");
  const authored =
    stack === "inertia-monolith"
      ? "resources/js/lib"
      : stack === "api-next"
        ? "packages/api-client"
        : "src/lib";
  expect(coverage).toContain(authored);
  if (stack === "inertia-monolith") {
    const config = read(`${root}/vite.config.ts`);
    for (const asset of ["docs/playbook/**", ".opencode/**", "scripts/**", "lefthook.yml"]) {
      expect(config).not.toContain(`"${asset}"`);
    }
  }
});

test.each(["inertia-monolith", "api-next"] as const)(
  "%s owns PHP tools and Boost paths",
  (stack) => {
    const root = stacks[stack].templateRoot;
    const phpRoot = stacks[stack].phpRoot!;
    const composer = json(`${root}/${phpRoot}/composer.json`);
    expect(composer.description).toEqual(expect.any(String));
    expect(composer.license).toBe("MIT");
    expect(composer.require["laravel/fortify"]).toBe("1.39.0");
    expect(composer.require["laravel/nightwatch"]).toBe("1.30.0");
    expect(composer.require["resend/resend-php"]).toBe("1.13.0");
    for (const tool of [
      "laravel/boost",
      "laravel/pint",
      "larastan/larastan",
      "phpstan/phpstan",
      "rector/rector",
      "driftingly/rector-laravel",
      "pestphp/pest",
      "pestphp/pest-plugin-laravel",
      "pestphp/pest-plugin-phpstan",
      "pestphp/pest-plugin-rector",
      "pestphp/pest-plugin-type-coverage",
      "funnysoft/boost-guidelines",
    ]) {
      expect(composer["require-dev"][tool], tool).toBeTruthy();
    }
    expect(composer.repositories).toContainEqual({
      type: "path",
      url: "packages/boost-guidelines",
      options: { symlink: false },
    });
    expect(composer.scripts["post-update-cmd"]).toEqual([
      "@php artisan boost:update --ansi",
      `bash ${stack === "api-next" ? "../../" : ""}scripts/boost-sync-opencode-skills.sh`,
    ]);
    expect(json(`${root}/${phpRoot}/boost.json`)).toMatchObject({
      agents: ["opencode"],
      cloud: true,
      guidelines: true,
      packages: ["funnysoft/boost-guidelines"],
      skills: expect.arrayContaining(["funnysoft-quality"]),
    });
    expect(read(`${root}/${phpRoot}/config/boost.php`)).toContain("'.opencode/skills'");
    if (stack === "inertia-monolith") {
      expect(composer.require["laravel/wayfinder"]).toBeTruthy();
      expect(composer["require-dev"]["spatie/laravel-typescript-transformer"]).toBeTruthy();
    } else {
      expect(composer.require["dedoc/scramble-pro"]).toBeTruthy();
      expect(json(`${root}/package.json`).devDependencies["openapi-typescript"]).toBeTruthy();
      expect(stacks[stack].jsRoots).toEqual([
        "apps/web",
        "packages/api-client",
        "packages/design-system",
      ]);
    }
  },
);
