# Registry Ingestion

## v0.1 strategy

Start curated.

The initial registry should contain manually reviewed metadata for a limited number of components from each supported source.

Target: approximately 20–60 total components before expanding.

Phase 1 bundles 20 manually reviewed records, four from each initial source, in `packages/registry/src/data/registry.json`. That committed file is the single canonical snapshot. `registries/<source>/README.md` records bounded official pages, component URL identities, annotation decisions, and metadata gaps. It contains no vendored upstream component source.

Quality matters more than volume.

## Why not crawl everything immediately

Large crawls introduce:

- unstable HTML parsing,
- license ambiguity,
- duplicate components,
- noisy metadata,
- brittle tests,
- unnecessary infrastructure.

Tessera should prove retrieval quality first.

## Adapter contract

Each adapter receives source-specific input and returns canonical components.

Conceptually:

```ts
interface RegistryAdapter<Input> {
  id: string;
  parse(input: Input): TesseraComponent[];
}
```

Adapter output must pass canonical schema validation before entering a registry snapshot.

## Source folders

Each initial source may keep curated metadata under:

```text
registries/<source>/
  components.json
  README.md
```

or another simple machine-readable layout chosen during implementation.

## Provenance

Every record must preserve where its metadata came from.

At minimum:

- source library,
- source URL when available,
- adapter name,
- optional upstream version or retrieval timestamp.

The curated snapshot uses `provenance.adapter: "manual"`, an ISO review timestamp, and a verified official URL in `links.docs`. Category, aesthetics, and tags are curator annotations, not upstream guarantees. Unknown visual scales remain `unknown`; missing compatibility facts stay absent. All curated dependency lists have `dependencyStatus: "unknown"`, so their empty arrays cannot be read as verified zero dependencies. Beautiful UI's framework is unverified and represented by the `other` catchall.

Public MIT evidence was verified for Beautiful UI and BeUI. Other sources' licenses remain unknown; free catalog availability and readable documentation do not establish redistribution rights. See source notes for evidence and scope.

`loadDefaultRegistry()` validates the bundled snapshot on every call and returns independent data sorted by canonical ID. The build copies the imported JSON into `dist/data/registry.json`; installed consumers require neither the repository root nor HTTP access.

## Refresh strategy

v0.1 may update curated records manually.

Later versions can add:

- source-specific fetchers,
- scheduled metadata refresh,
- diff review,
- registry snapshot publishing.

Automated refresh must still produce reviewable normalized diffs.
