# Dependency entitlement evidence

## Scramble Pro

The owner confirmed in this session: "Solo, I am the sole developer of FunnySoft". This establishes the declared license tier and developer count. It does not explicitly confirm whether the purchased update period covers pinned version `0.9.15`.

The official terms grant a non-transferable license for the purchaser's own or organizational projects, with unlimited projects within the purchased tier. Solo covers one natural person. Each purchase includes one year of updates and perpetual use of the versions covered by that period. The terms prohibit sharing or publicly distributing the package or license keys beyond the purchased plan.

Successful authenticated Composer installation is recorded in the package verification receipts. It proves download access, not transferable rights for unrelated generator users. No credentials were inspected for this entitlement check.

The owner added the repository Actions secret `COMPOSER_AUTH`. The coordinator verified its presence using `gh secret list --json name,updatedAt`; GitHub reported an update timestamp of `2026-09-09T00:00:49Z`. Only metadata was inspected. Hosted installation has not yet established that the secret works in CI.

The coordinator independently verified archive SHA-256 `a8076d66f6eb4d6c82144724e703da5afad03a186c1516cabf4961724de05605` and inspected all 962 file paths. The archive contains no `vendor` or `node_modules` directories, runtime `.env` files or Composer `auth.json` files. This confirms exclusion of those dependency and credential locations; it is not a content-level credential scan or an additional license grant.

Outstanding evidence:

- Confirmation that the purchase's update period covers `0.9.15`.
- Any separate redistribution permission needed if the delivered contents extend beyond dependency references and application integration code.

The generator's consumers must supply their own authorized Composer access unless their use is covered by the purchaser's license. The owner's Solo confirmation is not a license grant to all downstream users.

## Sources

- [Scramble Pro terms of service](https://scramble.dedoc.co/documents/terms-of-service), last updated November 25, 2025.
- [Scramble Pro pricing and FAQ](https://scramble.dedoc.co/pro).

Search evidence is retained locally at `/private/var/folders/7p/l3bv9g2j31l38ln4bmbqrx340000gn/T/opencode/scramble-license-terms.json`.
