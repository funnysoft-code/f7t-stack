# Registry components

These shadcn/ui Radix components were installed for U10 and reused from the Inertia template. U11 changes local import paths and adds the client directives required by Next. They retain the upstream component APIs. They are third-party generated UI, covered by browser integration and excluded by the existing generated-code coverage rule. Authored account interactions and the adapted QR component live in `apps/web/components`; authored transport and operation logic remain in the mandatory library coverage gate.

See `../COMPONENT-REUSE.md` for the inspected registry sources. Keep this directory for upstream primitives only, not authored application logic.
