# Local retrieval pipeline design

This design implements the existing product, architecture, model, CLI, MCP, and testing documents under the user's approval to continue through `TASKS.md` in order.

## Approach

Use one local, versioned JSON snapshot validated by `packages/registry`. Bundle that metadata with the package so installed CLI and MCP tools work without the repository or network access. Source-specific adapters ingest reviewed fixtures and validate their output. The alternative, loading every provider format during each search, would spread ingestion concerns into retrieval and add failure modes to an otherwise deterministic operation.

Keep the existing package boundaries. Registry owns schemas and file loading. Adapters depend on registry. Core depends on registry and owns all filtering, query intent, scoring, explanation, lookup, and installation guidance. CLI, MCP, and explorer consume core public APIs.

## Phase 1: registry

Implement the complete component shape in `docs/component-model.md` with strict Zod objects. Validate both record and snapshot schema versions, slug/ID identity, HTTP(S) links, supported enums, duplicate IDs, and known-license evidence. A snapshot has `schemaVersion: 1` and `components: TesseraComponent[]`. Empty snapshots are valid at the registry boundary; interfaces describe empty-registry errors explicitly.

Export `componentSchema`, `registrySchema`, their inferred types, category/framework/motion constants, `createComponentId`, `parseRegistry`, `loadRegistry`, `mergeRegistries`, `loadDefaultRegistry`, and a structured `RegistryError`. Loading distinguishes I/O, JSON syntax, and schema failures, with actionable messages and issue paths. Sort merged/default snapshots by canonical ID with an ASCII comparison.

Curate at least 20 real entries across all five initial sources. Preserve original URLs and review provenance. Use unknown values for unverified license, motion, dependencies, compatibility, and installation details. Visual/category tags are explicit curator annotations described in source notes. Store metadata only; no upstream component source is fetched or copied.

## Phase 2: adapters

Each provider has a small input schema and an adapter exposing `id` and `parse(unknown): TesseraComponent[]`. Provider fields normalize to canonical categories, tags, dependencies, installation guidance, and license evidence. Unknown categories map to `other`. Missing facts stay unknown. Every output goes through registry validation, including duplicates and identity checks. Tests use checked-in metadata fixtures.

## Phase 3: core

Expose `createRetrieval(snapshot)` with search, component lookup, installation guidance, similarity, pattern search, and facet data. Accept validated bounded structured inputs. Normalize tokens, categories, framework/Next.js intent, styles, motion, and product context without an LLM. Explicit filters take precedence over inferred preferences; impossible framework candidates are excluded.

Use the documented weights: relevance .35, compatibility .20, dependency cost .15, adaptability .15, accessibility .10, license .05. Unknown metadata contributes a documented neutral value where appropriate and is explained, rather than being represented as a positive claim. Unknown license receives no license credit. Stable IDs break score ties; input ordering cannot change output ordering.

Add explicit optional metadata for dependency knowledge, documented accessibility, and reviewed adaptability only if needed to implement those dimensions without guessing. Update the canonical-model documentation and tests together. Installation guidance is a plan, with caveats and redistribution status, never execution.

## Phases 4 and 5: interfaces

CLI exposes `search`, `inspect`, `similar`, and safe `add --dry-run` with human and JSON output. Empty search results exit successfully; invalid input and unknown IDs fail with actionable messages. `add` prints a plan even without the dry-run flag and never mutates another project.

MCP registers exactly the five tools in `docs/mcp.md` over the same core. Use the official TypeScript SDK, stdio transport, structured JSON results and safe error envelopes. Unknown IDs, invalid queries, unsupported filters, invalid snapshots, and empty registries have stable error codes. Tests cover actual protocol requests and compare results to core and CLI JSON.

## Phases 6 through 9

Polish the installable agent skill with decomposition, search, page design language, adaptation, licensing, and cohesion examples. Build the explorer only after CLI/MCP work. Build docs from maintained Markdown. Both applications follow owner-approved visual direction, responsive layouts, keyboard operation, visible focus, and real empty/loading/error behavior.

Hardening checks golden queries, malformed snapshots, duplicate IDs, license behavior, CLI errors/help, MCP errors, installed-package operation, and publishing dry runs. The repository's own distribution license is an owner decision; keep an honest unlicensed/private package status if no license is selected. A packaging dry run does not authorize publication.

## Delivery

Each phase has a dedicated branch and PR based on its predecessor. Tests are written first where practical. Run formatting, lint, typecheck, tests, and build before committing completed implementation and advancing. No merge, package publication, or hosted deployment is part of this execution.
