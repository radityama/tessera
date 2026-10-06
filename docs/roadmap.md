# Roadmap

No dates. Ordering reflects dependency and confidence, not scheduling.

## Shipped in v0.1.0

The local retrieval loop, end to end:

- a canonical registry schema with retrieval provenance and licence evidence,
- five verified sources, generated from each provider's own registry,
- deterministic lexical search with per-result score explanations,
- real artifact retrieval with an origin allowlist and bounded requests,
- a CLI (`search`, `inspect`, `similar`, `add --dry-run`, `fetch`, `mcp`, `doctor`),
- an MCP server with six tools,
- an agent skill, a registry explorer using the same search core, and integration docs for 11
  harnesses.

The thesis v0.1 set out to prove: **an agent can search real UI libraries, retrieve a real
reusable component, understand its dependencies and licence constraints, and adapt it into a
coherent application without generating the visually significant UI from scratch.**

## Next, in rough order

### Broader source coverage

Five sources with 73 components is enough to prove the loop and not enough to be broadly useful.
More shadcn registries, and Vue and Svelte sources, since the current catalogue is React-only.
Each addition needs a verified licence and a real retrieval mechanism — the bar does not move.

### Automatic registry refresh

`pnpm registry:sync` is manual and its diff is reviewed by a human. A scheduled job that opens a
pull request with the snapshot diff would keep the catalogue current without removing the review.

### Better search

Ranking is lexical and deterministic. It is honest and it is not clever. The main gap is that a
query naming several intents — "a hero _with_ a terminal, restrained motion" — spreads its budget
across all of them rather than preferring components that satisfy more than one. Weighting terms by
rarity across the registry is the obvious next step and needs no new infrastructure.

### Design-system compatibility scoring

A component's `visual` profile and a project's design language are both structured data. Scoring
fit between them would let `search_components` answer "which of these matches _my_ radius and
motion language" rather than leaving it to the agent. This is the most direct route to the cohesion
problem the skill currently handles with prose.

### Safe automatic installation

Today `add` prints a plan and `fetch` writes files where you point it. Detecting the target
project, resolving import aliases and merging into an existing design system are all harder, and
getting them wrong is destructive. It needs conflict detection and a dry-run that is trustworthy
before it needs speed.

## Explicitly not planned

These have been considered and are not v0.2 work:

- **Embeddings or vector search.** Lexical ranking is inspectable and explainable; a score
  explanation is a product requirement, and similarity scores are harder to justify to a user
  than term matches.
- **A hosted registry index.** The whole tool runs offline. A service would add an availability
  dependency, a privacy surface and an operating cost to solve a problem nobody has reported.
- **Screenshot or visual similarity.** Requires rendering arbitrary third-party components, which
  means executing them.
- **Figma ingestion.** A different product with a different input.
- **Automatic component adaptation.** Rewriting retrieved source to match a design system is an
  LLM-shaped task with a high blast radius. The agent already does it, with the user watching.

## How to influence this

Open a [feature request](https://github.com/radityama/tessera/issues/new/choose) describing the
problem you hit. Requests framed as "here is what I was doing when this failed" are far easier to
act on than "add support for X".
