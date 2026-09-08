import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { copyTemplateDir } from "./fs";

const temps: string[] = [];
afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "f7t-copy-"));
  temps.push(root);
  const source = path.join(root, "source");
  const target = path.join(root, "target");
  await mkdir(path.join(source, "nested"), { recursive: true });
  return { source, target };
}

test("copies binary bytes untouched, replaces declared text and promotes nested ignores with modes", async () => {
  const { source, target } = await fixture();
  const binary = Buffer.concat([Buffer.from([0xff, 0x00]), Buffer.from("__NAME__")]);
  await writeFile(path.join(source, "icon.png"), binary);
  await writeFile(path.join(source, "opaque.blob"), "__NAME__");
  await writeFile(path.join(source, "nested/gitignore"), "__NAME__\n");
  await writeFile(path.join(source, "nested/run.sh"), "#!/bin/sh\necho __NAME__\n", {
    mode: 0o755,
  });
  await copyTemplateDir(source, target, { __NAME__: "demo" });
  expect(await readFile(path.join(target, "icon.png"))).toEqual(binary);
  expect(await readFile(path.join(target, "opaque.blob"), "utf8")).toBe("__NAME__");
  expect(await readFile(path.join(target, "nested/.gitignore"), "utf8")).toBe("demo\n");
  expect(await readFile(path.join(target, "nested/run.sh"), "utf8")).toContain("echo demo");
  expect((await stat(path.join(target, "nested/run.sh"))).mode & 0o111).toBe(0o111);
});

test.each([".env", ".env.production", "auth.json", "database.sqlite", "private.tgz", ".npmrc"])(
  "rejects forbidden %s before writes",
  async (name) => {
    const { source, target } = await fixture();
    await writeFile(path.join(source, "a.txt"), "safe");
    await writeFile(path.join(source, "nested", name), "fixture");
    await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/forbidden/i);
    await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
  },
);

test("rejects symlinks and ignore promotion collisions before writes", async () => {
  const { source, target } = await fixture();
  await symlink("outside", path.join(source, "nested/link"));
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/symlink/i);
  await rm(path.join(source, "nested/link"));
  await writeFile(path.join(source, "nested/gitignore"), "one");
  await writeFile(path.join(source, "nested/.gitignore"), "two");
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/duplicate/i);
  await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
});

test("retains Laravel runtime directory ignores but rejects generated cache files", async () => {
  const { source, target } = await fixture();
  await mkdir(path.join(source, "storage/framework/cache/data"), { recursive: true });
  await writeFile(path.join(source, "storage/framework/cache/data/gitignore"), "*\n!.gitignore\n");
  await copyTemplateDir(source, target, {});
  expect(
    await readFile(path.join(target, "storage/framework/cache/data/.gitignore"), "utf8"),
  ).toContain("!.gitignore");
  await rm(target, { recursive: true });
  await writeFile(path.join(source, "storage/framework/cache/data/cached-value"), "runtime");
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/Forbidden/);
  await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
});

test("rejects invalid declared text and credential metadata before writes", async () => {
  const { source, target } = await fixture();
  await writeFile(path.join(source, "a.txt"), "safe");
  await writeFile(path.join(source, "nested/b.txt"), Buffer.from([0xff]));
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow();
  await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
  await rm(path.join(source, "nested/b.txt"));
  await writeFile(
    path.join(source, "composer.lock"),
    '{"url":"https://fixture:credential@example.invalid/file"}',
  );
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/Credential-bearing/);
  await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
});

test("preflights every destination before writing through an existing symlink", async () => {
  const { source, target } = await fixture();
  await writeFile(path.join(source, "a.txt"), "safe");
  await writeFile(path.join(source, "nested/b.txt"), "safe");
  await mkdir(target);
  await symlink(source, path.join(target, "nested"));
  await expect(copyTemplateDir(source, target, {})).rejects.toThrow(/Symlink/);
  await expect(stat(path.join(target, "a.txt"))).rejects.toMatchObject({ code: "ENOENT" });
});
