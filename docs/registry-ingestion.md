# Registry ingestion

## How registry data is produced

```text
provider registry endpoint
        ↓
pnpm registry:sync           (packages/adapters/src/sync.ts)
        ↓
verified, pinned snapshot    (registries/<source>/components.json)
        ↓
local deterministic search   (no network)
```

The sync is the **only** step that touches the network while the registry is built. Search,
`inspect`, `similar`, `get_component` and every MCP tool read the pinned snapshot from disk.

Regenerate with:

```bash
pnpm registry:sync
```

Do not hand-edit `registries/*/components.json`. The sync writes one `components.json` per
source plus `registries/snapshot-meta.json`, which records the generation time and per-source
counts.

## Verified ingestion, not curation by hand

An earlier version of this repository contained hand-written records for five libraries. Three
problems made that untenable:

1. one of the libraries did not exist at all;
2. several licenses were attributed without evidence, and at least two were simply wrong;
3. component names were invented rather than read from upstream.

The fix was structural. Records are now derived from each provider's own registry, so a
component exists in Tessera only if the provider publishes it. Adapters normalize; they do not
imagine.

## Adapter contract

```ts
interface RegistryAdapter<TInput> {
  id: string;
  parse(input: TInput): TesseraComponent[];
}
```

Adapter output must pass canonical schema validation before entering a snapshot —
`toCanonical()` throws otherwise, so an adapter cannot emit an invalid record.

Adapters are the only place provider specifics are allowed to live. `@tessera-dev/core` contains no
provider conditionals.

## Selection

Providers publish more than Tessera indexes. Candidates are ordered by how much of a page they
represent — heroes and navbars first, then pricing, command menus and terminals, then
dashboards and tables, then backgrounds, then generic cards — and capped per source. Demos and
examples are excluded: a provider publishes `…-demo-1` to illustrate a component, not to be one.

## Skipping non-public items

Some providers list an item in a public index while keeping the item endpoint behind
authentication. Those items are skipped, with a count reported:

```text
aceternity: 8 components (82 not public, skipped)
```

A component with no retrievable artifact does not belong in a catalogue that promises
retrieval. Skipping is preferable to indexing a dead end.

## Licensing a mixed catalogue

A provider may mix free and paid content under one registry. Efferd's hosted catalogue holds
231 items while its MIT repository holds 40.

Inheriting MIT from a sibling item would be exactly the invented provenance this project exists
to avoid. `resolveItemLicense()` narrows the license **per item**: an item present in the
open-source repository keeps MIT; anything else is recorded as `unknown`. Those items then rank
lower and raise a warning rather than being silently reusable.

## Determinism and failure behaviour

- Output is sorted, so a re-run produces a reviewable diff rather than churn.
- Transient CDN failures (401/403/5xx from edge bot protection) are retried with backoff.
- A definitive "not public" response is never retried.
- A provider that changes shape **aborts** the sync instead of quietly emitting a smaller
  catalogue.

## Refresh strategy

v0.1 refreshes manually via `pnpm registry:sync`, and every refresh is reviewed as a diff.
Scheduled refresh and automated diff review are post-v0.1.
