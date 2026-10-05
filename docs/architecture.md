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
source fixture / source metadata
       ↓
source adapter
       ↓
canonical registry validation
       ↓
registry snapshot
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

## Source-code policy

Registry metadata and third-party source code are separate concerns.

A registry item may point to:

- a source URL,
- an installation command,
- an upstream registry endpoint,
- a public code page.

Tessera must not assume it has the right to redistribute source code merely because it can index metadata.

## Future architecture

Possible later layers:

- hosted registry snapshots,
- semantic search,
- visual embeddings,
- screenshot similarity,
- personalized project design-language profiles,
- automated adaptation planning.

These are deliberately excluded from the first implementation.
