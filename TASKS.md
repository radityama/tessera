# Implementation Tasks

Work in phases. Do not collapse all phases into one giant change.

## Phase 0 — Repository foundation

- Configure pnpm workspaces.
- Configure Turborepo.
- Add TypeScript base config.
- Add linting and formatting.
- Add Vitest.
- Add workspace scripts: `build`, `dev`, `lint`, `typecheck`, `test`.
- Add package manifests to every package.
- Add CI for install, lint, typecheck, and test.
- Keep all packages buildable even if implementation is initially minimal.

Exit criteria:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

all succeed.

## Phase 1 — Canonical registry model

Implement `packages/registry`.

- Define schemas from `docs/component-model.md`.
- Use Zod validation.
- Implement stable component IDs: `<source>/<component-slug>`.
- Implement registry file loading.
- Implement duplicate detection.
- Implement schema versioning.
- Add fixtures and tests.

Create at least 20 manually curated example entries across the initial sources.

Do not fetch remote source code yet.

## Phase 2 — Source adapters

Implement `packages/adapters`.

Initial adapters:

- Aceternity UI
- Beautiful UI
- BeUI
- HeroUI
- Efferd

Each adapter should:

- normalize source metadata,
- map categories,
- map visual tags,
- map dependency metadata,
- preserve original source URL,
- preserve explicit license information when known,
- emit the canonical schema.

Tests must use fixtures, never live HTTP.

## Phase 3 — Retrieval and ranking

Implement `packages/core`.

- query normalization,
- tokenization,
- category inference,
- framework filters,
- style filters,
- deterministic score calculation,
- score explanation,
- result limits,
- similar-component lookup,
- pattern search.

Use the weighting defined in `docs/search-ranking.md` as the initial baseline.

## Phase 4 — CLI

Implement `packages/cli`.

Commands:

```text
tessera search
tessera inspect
tessera similar
tessera add --dry-run
```

The CLI must consume public APIs from `packages/core`; do not duplicate search logic.

## Phase 5 — MCP server

Implement `packages/mcp`.

Tools:

```text
search_components
get_component
get_installation
find_similar_components
search_patterns
```

Follow `docs/mcp.md` strictly.

Add contract tests that verify MCP output matches equivalent core retrieval results.

## Phase 6 — Tessera skill

Polish `skills/tessera/SKILL.md` into an installable coding-agent skill.

It must teach the agent to:

- decompose UI before coding,
- search before building visually significant sections,
- avoid blind component mixing,
- create a page-level design language,
- adapt third-party components,
- run a visual cohesion pass,
- prefer original implementation for product-specific UI.

Add examples of good and bad behavior.

## Phase 7 — Registry explorer

Build `apps/web`.

Required pages:

- home/search,
- component detail,
- source/library page,
- category page.

Useful filters:

- source,
- category,
- framework,
- motion,
- dependency count,
- aesthetic tags.

Do not turn the website into the core product. It is an explorer for the same registry.

## Phase 8 — Documentation site

Build `apps/docs` from the Markdown docs in this repository.

Required sections:

- concept,
- architecture,
- registry schema,
- CLI,
- MCP,
- skill integration,
- adding a registry source,
- licensing model,
- contributing.

## Phase 9 — v0.1 hardening

- integration tests,
- snapshot tests for representative queries,
- malformed registry tests,
- duplicate ID tests,
- unknown-license behavior,
- CLI help and error UX,
- MCP error contract,
- package publishing dry run,
- installation docs,
- example agent workflows.

Only after this phase should v0.1 be considered releasable.
