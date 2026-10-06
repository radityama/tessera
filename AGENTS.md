# AGENTS.md

You are implementing **Tessera**, an open-source UI retrieval layer for coding agents.

Your job is to turn this scaffold into a reliable developer tool without changing the core product thesis.

## Core thesis

Coding agents often generate visually important UI from scratch even when better implementations already exist in component libraries.

Tessera gives agents a structured way to:

1. decompose a page into visual needs,
2. search existing UI registries,
3. rank suitable components,
4. inspect installation and dependency requirements,
5. adapt chosen components to a project's design language,
6. keep the final page visually coherent.

## Prime directive

**Reuse composition, not identity.**

Imported UI must be adapted to the host project. Do not preserve third-party demo branding, copy, color system, spacing system, or product identity unless explicitly requested.

## Engineering priorities

In order:

1. correctness,
2. maintainability,
3. deterministic behavior,
4. excellent developer experience,
5. extensibility,
6. performance,
7. cleverness.

Prefer boring, inspectable code over magical abstractions.

## Required implementation workflow

For each phase:

1. read the relevant docs,
2. write or update tests first where practical,
3. implement the smallest complete slice,
4. run typecheck + lint + tests,
5. update docs if behavior changed,
6. commit with a clear conventional commit,
7. move to the next phase only when the previous phase is green.

If working with GitHub access:

- use one branch per major phase,
- open a PR for each phase,
- keep PRs reviewable,
- do not mix unrelated refactors,
- add release notes only when a user-facing milestone is actually complete.

## Constraints

Do not:

- build a hosted service before the local product works,
- add a vector database in v0.1,
- scrape entire third-party websites blindly,
- copy third-party source into this repository unless their license explicitly permits it and the product design requires vendoring,
- invent license metadata,
- silently install dependencies into user projects,
- expose tools that execute arbitrary shell commands,
- allow source adapters to bypass registry validation,
- generate UI from the MCP server itself.

## Architecture boundaries

### `packages/registry`

Owns canonical schemas, validation, persistence format, and registry loading.

### `packages/adapters`

Owns source-specific normalization logic.

Adapters must output the canonical registry schema and must not leak provider-specific shapes downstream.

### `packages/core`

Owns query normalization, filtering, ranking, score explanations, and retrieval orchestration.

It must not depend on MCP or CLI presentation code.

### `packages/mcp`

Thin protocol adapter over `packages/core`.

### `packages/cli`

Thin human-facing adapter over `packages/core`.

### `skills/tessera`

Instructional policy for coding agents. No runtime dependency on the skill should be required for the core library.

### `apps/web`

Browse/search experience. It consumes the same core APIs and registry data as the CLI/MCP.

## API design rules

- Prefer small primitive tools over provider-specific tools.
- Stable tool names matter.
- Every search result should be explainable.
- Every component must have a stable canonical ID.
- Missing metadata should be explicit rather than guessed.
- Scores must be deterministic for the same query and registry snapshot.

## Initial MCP tools

Implement these first:

- `search_components`
- `get_component`
- `get_installation`
- `find_similar_components`
- `search_patterns`

Do not add more tools without proving a distinct use case.

## Initial CLI

Target UX:

```bash
tessera search "dark technical terminal hero"
tessera inspect beautifului/terminal-hero
tessera add beautifului/terminal-hero --dry-run
tessera similar beautifului/terminal-hero
```

`add` must be safe by default. In v0.1, it may print a plan and installation instructions instead of mutating files automatically.

## Quality bar

The project is not ready if:

- results cannot explain why they ranked highly,
- metadata differs between CLI and MCP,
- adapters can return invalid records,
- tests depend on live third-party websites,
- one source library receives special-case behavior in core ranking,
- components with unknown licenses are treated as safe to vendor,
- the result set is visually incoherent when used by the skill.

## When uncertain

Favor the smallest architecture that keeps source ingestion, retrieval, and agent protocol boundaries clean.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
