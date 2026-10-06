# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-06

First release. The local retrieval loop works end to end: search real UI libraries, retrieve a
real component, understand its dependencies and licence, and adapt it into a project.

### Added

- **Canonical component registry** (schema v2) with a `retrieval` union describing where an
  implementation actually comes from, and licence fields carrying evidence.
- **Verified sources**: Aceternity UI, beUI, Efferd, HeroUI and Magic UI — 73 components, every
  one derived from its provider's own registry rather than written by hand.
- **Deterministic search and ranking** with per-result score explanations, filters, similar-component
  lookup and pattern search. No embeddings, no vector store, no network.
- **Artifact retrieval** (`resolveComponentArtifact`): fetch a component's real upstream source,
  with an origin allowlist, bounded redirects, timeouts, a response-size cap and payload validation.
- **CLI**: `search`, `inspect`, `similar`, `add --dry-run`, `fetch`, `doctor`, `mcp`.
- **MCP server** over stdio with six tools: `search_components`, `get_component`,
  `get_component_artifact`, `get_installation`, `find_similar_components`, `search_patterns`.
- **Agent Skill** teaching decomposition, design-language first, retrieval, adaptation and a
  cohesion pass.
- **Bundled registry**, so an installed Tessera works without a cloned repository.
- **Harness integration docs** for 11 coding agents, each checked against that harness's current
  official documentation.
- **Registry explorer** consuming the same search core as the CLI and MCP.
- **Registry sync** (`pnpm registry:sync`) producing pinned, reviewable snapshots.
- **Release gates**: `pnpm smoke:pack` (pack, install elsewhere, drive the real CLI and MCP),
  `pnpm mcp:conformance` (MCP protocol suite) and `pnpm dogfood` (search, retrieve, adapt and
  compile a real upstream component in a throwaway host project).

### Safety

- Licences carry an evidence URL or are recorded as `unknown`. A `known` licence without evidence
  fails validation.
- `redistribution` is recorded separately from `status`, because a licence can be known and still
  forbid reuse.
- Unknown-licence components rank lower and warn before use.
- `fetch` never overwrites a file silently, and rejects upstream paths that escape the output
  directory.
- Tessera never executes retrieved code, installs dependencies, or runs shell commands.
- A release guard fails the build on placeholder domains, unevidenced licences, missing retrieval
  metadata, and non-OSI licences marked OSI-approved.

### Changed

- Schema v1 records are **rejected**, not migrated. v1 could not express retrieval provenance or
  licence evidence, so converting one would mean inventing those answers.
- Publishable packages moved to the `@tessera-dev` npm scope. The `@tessera` scope is owned by an
  unrelated account and the name `tessera` is taken. The binary is still `tessera`.
- Removed the `shared` package, which was declared as a dependency but imported nowhere.

### Known limitations

The local loop works; the ecosystem coverage does not yet. Recorded here rather than left for
users to discover:

- `fetch` returns a component's own files and **does not resolve its registry dependencies**.
  Components that declare them will be missing pieces until installed through the shadcn CLI.
- Provider-declared dependencies can **under-report actual imports** — `magicui/terminal` imports
  `motion`, which its registry entry does not list.
- Five sources, React only. Ranking is lexical and does not weigh multi-intent queries.
- `add` is dry-run only. Ten of eleven harness integrations are config-verified, not runtime-tested.

### Removed

- The `beautifului` source. No component library by that name exists; its records, URLs and
  licences were invented, including the former flagship example `beautifului/terminal-hero`.

[Unreleased]: https://github.com/radityama/tessera/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/radityama/tessera/releases/tag/v0.1.0
