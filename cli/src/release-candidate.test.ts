import { expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { releaseFixture, writeFixtureFile } from "./package-fixtures";
import { packedMatrix } from "./packed-matrix";
import { packageRoot } from "./paths";
import { prepareCandidate, prepareRelease } from "./release-candidate";

test("candidate builder requires explicit fixture mode before reading or writing files", async () => {
  await expect(
    prepareCandidate({
      output: "unused",
      exportRoot: "unused",
      digest: "unused",
      templateRevision: "unused",
      fixtureMode: false,
    }),
  ).rejects.toThrow("requires --fixture-mode");
});

test("candidate preparation refuses to overwrite the checkout", async () => {
  await expect(
    prepareCandidate({
      output: packageRoot(),
      exportRoot: "unused",
      digest: "unused",
      templateRevision: "1".repeat(40),
      fixtureMode: true,
    }),
  ).rejects.toThrow("new directory outside the checkout");
});

test("release preparation rejects a different published identity before creating output", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "f7t-release-identity-"));
  try {
    const fixture = await releaseFixture(root);
    await expect(
      prepareRelease({
        output: path.join(root, "output"),
        exportRoot: path.join(root, "template/standards"),
        digest: fixture.standards.assetDigest,
        templateRevision: "0.2.0",
        standardsRelease: "v0.3.0",
        standardsCommit: "a".repeat(40),
      }),
    ).rejects.toThrow("Published standards identity does not match");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([false, true])(
  "packed fixture mode %s cannot bypass the pending production manifest",
  async (fixtureMode) => {
    const root = await mkdtemp(path.join(tmpdir(), "f7t-pending-"));
    try {
      await writeFixtureFile(root, "package.json", JSON.stringify({ version: "0.1.0" }));
      await writeFixtureFile(
        root,
        "template/manifest.json",
        JSON.stringify({ schemaVersion: 1, status: "pending-release" }),
      );
      await expect(
        packedMatrix({ source: root, output: "unused", fixtureMode, install: false }),
      ).rejects.toThrow("Release bundle is pending");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
