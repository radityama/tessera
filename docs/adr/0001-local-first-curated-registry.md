# ADR 0001 — Local-first curated registry for v0.1

## Status

Accepted for initial implementation.

## Context

Tessera needs component data from multiple UI libraries. A large automated crawler is tempting but would introduce unstable parsing, legal ambiguity, operational overhead, and noisy data before retrieval quality is proven.

## Decision

v0.1 uses a curated, local registry snapshot normalized through source adapters.

Search must work without network access.

## Consequences

Positive:

- deterministic behavior,
- easy tests,
- fast development,
- explicit metadata review.

Negative:

- smaller initial catalog,
- manual maintenance,
- source freshness is limited.

These tradeoffs are acceptable for v0.1.
