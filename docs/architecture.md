# Architecture

## System overview

```text
                         ┌─────────────────────┐
                         │   Coding Agent      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Tessera Agent Skill │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                                       │
        ┌───────▼────────┐                      ┌───────▼───────┐
        │ MCP interface  │                      │ CLI interface │
        └───────┬────────┘                      └───────┬───────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Retrieval Core    │
                         │ query/filter/rank   │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Unified Registry    │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼─────────────────┐
                 │                  │                 │
           ┌─────▼─────┐     ┌──────▼──────┐   ┌──────▼─────┐
           │ Adapter A │     │ Adapter B    │   │ Adapter C  │
           └─────┬─────┘     └──────┬──────┘   └──────┬─────┘
                 │                  │                 │
           third-party       third-party       third-party
             source              source             source
```

## Architectural rule

All interfaces must consume the same canonical registry model and the same retrieval core.

There is one search implementation, not one per interface.

## Package dependency direction

```text
shared
  ↑
registry ← adapters
  ↑
core
  ↑
├── cli
├── mcp
└── web
```

The dependency direction must never reverse.

For example, `core` must not import from `mcp`.

## Local-first v0.1

v0.1 should operate against a local registry snapshot committed to the repository or installed with the package.

This has several advantages:

- deterministic tests,
- no network requirement for search,
- predictable latency,
- easy debugging,
- reproducible ranking.

Remote refresh and hosted registry distribution may be introduced later.

## Data pipeline

```text
provider registry endpoint          (network, at sync time only)
       ↓
source adapter
       ↓
canonical registry validation       (schema v2, registry provenance + license evidence)
       ↓
registry snapshot                   (registries/<source>/components.json)
       ↓
query normalization
       ↓
filter candidate set
       ↓
score candidates
       ↓
sort deterministically
       ↓
return score + explanation
```

## Artifact pipeline

Retrieval is a second, opt-in path. Search never touches the network; obtaining an
implementation does.

```text
component id
       ↓
look up retrieval metadata in the pinned snapshot
       ↓
validate provider against the registry-derived allowlist
       ↓
fetch upstream (timeout + response size cap)
       ↓
validate payload against the artifact schema
       ↓
return files + dependencies + license + provenance
```

The upstream URL always comes from registry metadata, never from caller input, so a caller
cannot point Tessera at an arbitrary host. Retrieved files are returned to the calling agent and
are never executed, written, or installed by Tessera.

## Distribution

`registries/` is consumed at runtime, so it must ship with the published package. The
distribution package bundles the snapshot rather than resolving a path inside a cloned
repository — see `docs/distribution.md`.

## Source-code policy

Registry metadata and third-party source code are separate concerns.

A registry item may point to:

- a source URL,
- an installation command,
- an upstream registry endpoint,
- a public code page.

Tessera must not assume it has the right to redistribute source code merely because it can index
metadata. This is why snapshots contain no `files` content, and why a component whose license is
`redistribution: "restricted"` can still be indexed and fetched while never being vendored.

## Future architecture

Possible later layers:

- hosted registry snapshots,
- semantic search,
- visual embeddings,
- screenshot similarity,
- personalized project design-language profiles,
- automated adaptation planning.

These are deliberately excluded from the first implementation.
