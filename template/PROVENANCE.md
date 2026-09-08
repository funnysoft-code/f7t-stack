# Template provenance

The generator owns runnable application templates and their dependency locks. FunnySoft standards owns policy, playbook documents and shared engineering assets. Generated applications require no sibling checkout or generation-time download of standards.

## Release state

This development tree has no assigned multi-stack release identity. `manifest.json` deliberately fails release verification until U14 supplies the tested immutable standards export, completed template inventory and composition lock catalog. Do not pin an export from a changing standards working tree.

## Release manifest, schema 1

A releasable manifest has `status: "release"`, the exact `generatorVersion` from the package, a full 40-character `templateRevision`, and `standards: { release, commit, assetDigest }`. The coordinator verifies that the standards version tag resolves to the tested commit before exporting it. Hashes detect bundle corruption against the shipped pin, they do not attest Git history or authenticate the npm publisher.

`templates` maps each standards variant to a template-relative `root`. `assets` inventories every file beneath `template/`, except this manifest and the separately verified `standards/` export. Each entry declares `path`, SHA-256 `sha256`, numeric `mode` of 420 or 493, and boolean `text`. Include this provenance notice, license notices, extras, locks, nested dotfiles and executable scripts. Unknown inventory files fail verification.

The standards schema 1 manifest binds its runtime hash, every asset hash, path, mode, text policy, layout and immutable identity through `assetDigest`. The generator checks it independently before importing `apply.mjs`, then calls the shared `verifyExport` and `applyExport`. Standards writes its own receipts. `F7T_MANIFEST.json` records generator, template and standards identity. The bundled runtime requires Node.js 22 or newer.

## Composed dependency locks

`locks` entries contain `key`, `manifests` and `files`. Build the key with `compositionKey` using all normalized dependency-affecting choices, including the stack. `manifests` maps generated package or Composer manifest paths to `dependencyDigest` values. `files` declares template-relative `source`, target-relative `destination` and `sha256` for each tested lock. Sources must also appear in `assets`.

Before dependency installation, call `applyReleaseLock` after composing manifests. Unsupported choices, mismatched dependency declarations and altered locks fail. Install with the package manager's frozen-lock mode and propagate failures. Never repair a frozen-lock error by silently resolving new versions. U14 must enumerate all supported compositions and prove frozen installation for each.

## Copy and distribution policy

Template replacement is limited to the explicit text extensions and filenames in `cli/src/fs.ts`. Unknown types and binary files retain their bytes. Add new text types deliberately. Nested `gitignore` files become `.gitignore`; collisions fail. File executable bits are preserved. Source and destination symlinks fail.

Dependency trees, build output, runtime caches, local databases, environment files other than `.env.example`, authentication files and package archives are rejected. Dependency metadata must contain no authenticated URLs or Composer credentials. Private packages, including Scramble Pro, are installed from authorized configured sources, never redistributed. Lockfiles contain only sanitized repository URLs. Real credentials are not template inputs.

`bun run verify:package` audits the package allowlist and template inventory. `bun run verify:release` additionally requires the complete release manifest. Publishing runs both checks. The fixture package test packs and extracts outside the checkout and exercises the same APIs with a synthetic standards schema 1 export; it does not assign a real standards release.
