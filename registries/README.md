# Registry data

This directory holds Tessera's pinned component snapshots. It is **generated**, not hand-written.

```bash
pnpm registry:sync
```

The sync script lives in `packages/adapters/src/sync.ts`. It reads each provider's own
registry, normalizes it through the adapters, and writes one `components.json` per source plus
`snapshot-meta.json` recording what was fetched and when.

Do not edit `components.json` by hand. A hand-edited record is exactly how this project once
shipped invented provenance — placeholder domains, licenses attributed without evidence, and
component names no upstream library ever published. The sync script is the fix.

Search, `inspect`, `similar` and the MCP tools all read these files locally. **No search ever
touches the network.** Only `tessera fetch` (and `registry:sync` itself) do.

## Sources

| Source       | Components | Retrieval                                | License at source                                                                       |
| ------------ | ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `aceternity` | 8          | shadcn registry, `@aceternity` namespace | `LicenseRef-Aceternity` — use permitted, redistribution restricted, not OSI-approved    |
| `beui`       | 15         | shadcn registry, direct item URL         | MIT (free tier; a separate paid tier exists at pro.beui.dev)                            |
| `efferd`     | 20         | shadcn registry, direct item URL         | MIT for items in the open-source repository; items outside it are recorded as `unknown` |
| `magicui`    | 18         | shadcn registry, direct item URL         | MIT                                                                                     |
| `heroui`     | 12         | npm package `@heroui/react`              | MIT (npm metadata; the repository's default branch carries an Apache-2.0 LICENSE file)  |

Counts move whenever upstream changes. `snapshot-meta.json` is the authority for the current run.

## Why some providers contribute few components

Each provider publishes more items than Tessera indexes, and some items are not publicly
retrievable:

- **Aceternity** lists 294 items, but its section-level blocks are behind an account. Only
  items whose endpoint answers without authentication are indexed, because a component with no
  retrievable artifact does not belong in a catalogue that promises retrieval.
- **Efferd** publishes 231 hosted items but only 40 live in its MIT repository. Items outside
  the repository are recorded with `license.status: "unknown"` rather than inheriting MIT from
  a sibling — see `resolveItemLicense` in `packages/adapters/src/shadcn.ts`.

## What Tessera stores, and what it does not

Tessera stores **metadata only**: names, categories, dependencies, retrieval URLs, license facts
and provenance. It does not store component source. Source is fetched on request by
`tessera fetch` and handed to the caller, which is why a restricted-redistribution license such
as Aceternity's is compatible with indexing but not with vendoring.

## Adding a source

1. Verify the project exists and find its official registry or package.
2. Record its license with an evidence URL.
3. Add a descriptor to `packages/adapters/src/sources.ts`.
4. Run `pnpm registry:sync` and review the diff — every new component must trace to a real
   upstream item.
