# Registry Ingestion

## v0.1 strategy

Start curated.

The initial registry should contain manually reviewed metadata for a limited number of components from each supported source.

Target: approximately 20–60 total components before expanding.

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
  id: string
  parse(input: Input): TesseraComponent[]
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

## Refresh strategy

v0.1 may update curated records manually.

Later versions can add:

- source-specific fetchers,
- scheduled metadata refresh,
- diff review,
- registry snapshot publishing.

Automated refresh must still produce reviewable normalized diffs.
