# Release readiness — Tessera v0.1.0 baseline

Branch: `chore/v010-baseline-audit`. Read-only audit, no architecture changes.
Date: 2026-10-06. Baseline commit: `10b12a2` (main).

## Environment

```text
Node:            v22.23.2
pnpm:            10.15.0
TypeScript:      ~5.9.2 (all packages)
MCP SDK:         1.32.1 (manifest allows ^1.12.0)
Package version: 0.1.0 (all 8 workspace packages, consistent)
Registry:        22 entries across 5 sources
Tests:           67 it-blocks in 11 files, all passing
Checks:          pnpm lint / typecheck / test / build — all green (uncached)
CLI commands:    search, inspect, similar, add --dry-run
MCP tools:       search_components, get_component, get_installation,
                 find_similar_components, search_patterns
Rulesets:        none
Releases/tags:   none
LICENSE file:    none (blocker, see below)
npm publish:     never attempted; `tessera` name TAKEN (unrelated 0.15.5);
                 no npm auth on this machine
```

## Phase audit vs TASKS.md

| Phase               | Implemented? | Correct? | Production-ready? | Remaining work                                                                                                              | Evidence                                                                     |
| ------------------- | ------------ | -------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 0 foundation        | yes          | yes      | mostly            | CI ordering fixed in 10b12a2                                                                                                | `pnpm lint/typecheck/test/build` green; `.github/workflows/ci.yml`           |
| 1 registry model    | yes          | yes      | **no**            | placeholder `example.com` URLs in beautifului/beui/efferd snapshots; 2 entries carry `unknown` license without verification | `registries/*/components.json`; `packages/registry/src/*.test.ts` (19 tests) |
| 2 adapters          | yes          | partial  | **no**            | adapters normalize fictional provider shapes, not real upstream metadata                                                    | `packages/adapters/src/*.ts`, fixture-only tests                             |
| 3 retrieval/ranking | yes          | yes      | mostly            | golden queries pass; no artifact resolution; ranking is lexical only (acceptable for v0.1)                                  | `packages/core/src/*.test.ts` incl. snapshots                                |
| 4 CLI               | yes          | yes      | **no**            | works only inside monorepo (depends on root `registries/`); no `fetch`/`doctor`/`mcp` commands                              | `packages/cli/dist/cli.js --help`                                            |
| 5 MCP               | yes          | yes      | **no**            | same monorepo-path dependency; no artifact tool                                                                             | `packages/mcp/src/server.test.ts` (7 contract tests)                         |
| 6 skill             | yes          | yes      | mostly            | needs retrieval-artifact step once §7–8 land                                                                                | `skills/tessera/SKILL.md`                                                    |
| 7 web explorer      | yes          | partial  | **no**            | client-side `String.includes` filter duplicates ranking instead of using `@tessera-dev/core`                                | `apps/web/scripts/build.mjs`                                                 |
| 8 docs site         | yes          | yes      | mostly            | missing integrations/licensing-process pages (planned in release branches)                                                  | `apps/docs/dist/*.html` (11 pages)                                           |
| 9 hardening         | yes          | yes      | mostly            | smoke tests cover workspace only, not installed tarballs                                                                    | snapshot + hardening + CLI/MCP contract tests                                |

## Release blockers (drive the branch sequence)

1. Fake registry data: `beautifului.example.com`, `beui.example.com`, `efferd.example.com` must become verified upstream evidence (`feat/v010-real-registries`).
2. No artifact retrieval: search ends at install instructions (`feat/v010-artifact-retrieval`).
3. No distribution: CLI/MCP unusable outside the monorepo; npm name + auth unresolved (`feat/v010-distribution`).
4. No governance: no LICENSE, no CODE_OF_CONDUCT/SECURITY/SUPPORT, no issue/PR templates, no rulesets (`chore/v010-repository-governance`).
5. No release automation or tag protection (`chore/v010-release-automation`, `release/v0.1.0`).

## Non-blockers (accepted v0.1 limitations)

Lexical deterministic ranking, React-heavy catalog, curated source set, no auto-mutation, no telemetry, local-first search.
