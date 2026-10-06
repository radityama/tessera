# Tessera Registry Explorer

Static site for browsing the registry. One generated page per component, source and category,
plus a search page.

```bash
pnpm --filter @tessera-dev/web build     # writes apps/web/dist
```

## Search is the real search

The search box calls the same `searchRegistry` the CLI and MCP use, bundled for the browser from
`@tessera-dev/core/search`. There is no separate ranking implementation.

This is a correction: the first version filtered rendered text with `String.includes`, which made
"search" on the website and "search" in the CLI two different features sharing a name.
`src/explorer-parity.test.ts` bundles the client exactly as the build does and asserts identical
ordering and scores for a set of queries, so the two cannot drift apart again.

The bundle imports the `./search` subpath rather than the package root, so artifact retrieval —
which has no meaning in a static page — is not shipped to the browser. The bundle is about 9KB.

## What the pages distinguish

Each component shows whether its artifact is retrievable, as distinct from whether metadata exists.
`metadata only`, `package install` and `artifact retrievable` are different answers and are
presented as such, alongside licence status including whether redistribution is restricted.

## Data

Read from the repository's `registries/` snapshot at build time. Regenerate with
`pnpm registry:sync`.
