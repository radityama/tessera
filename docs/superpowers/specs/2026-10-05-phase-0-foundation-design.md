# Tessera Phase 0: Repository Foundation

Date: 2026-10-05

Status: written specification approved in conversation on 2026-10-05.

## Purpose and scope

Make the existing scaffold a reproducible, buildable TypeScript monorepo before
implementing the local retrieval pipeline. This specification covers Phase 0 of
`TASKS.md`. Phases 1 through 9 remain required and retain their documented order.

The repository's product and architecture documents remain authoritative. This
phase establishes tooling and package boundaries without introducing component
records, adapters, ranking, CLI commands, MCP tools, or website functionality.

## Decisions and alternatives

Use Node.js 24+, an exact pinned pnpm 10 release, Turborepo, strict TypeScript,
ESLint, Prettier, and Vitest. The user approved this design and runtime baseline
in conversation on 2026-10-05.

ESLint and Prettier are the recommended combination because formatting and
package import restrictions have separate, inspectable configuration. Biome
would consolidate tooling but require a separate solution for the architecture
checks. Dedicated shared tooling packages would centralize configuration at the
cost of extra package boundaries and initial maintenance; root configuration is
sufficient for the current scaffold.

Select exact compatible dependency versions during implementation and record
them in manifests and the lockfile. Retain pnpm's existing major version rather
than upgrading the project's package manager as part of foundation work.

## Workspace and package boundaries

Keep `apps/*` and `packages/*` as the workspace roots. Add a manifest to each of
the six library packages and two application packages. The root and application
packages remain private. Library packages also remain private during foundation
work; distribution metadata is addressed during Phase 9.

Production imports follow the direction in `docs/architecture.md`:

| Package             | Allowed internal dependencies |
| ------------------- | ----------------------------- |
| `@tessera/shared`   | None                          |
| `@tessera/registry` | shared                        |
| `@tessera/adapters` | registry, shared              |
| `@tessera/core`     | registry, shared              |
| `@tessera/cli`      | core, shared                  |
| `@tessera/mcp`      | core, shared                  |
| `@tessera/web`      | core, shared                  |
| `@tessera/docs`     | None                          |

Declare dependencies only when consumed and use `workspace:*` for internal
dependencies. Use package exports for public interfaces rather than relative
imports into another package's source directory. ESLint rejects forbidden
production imports and imports that bypass those exports. Test files may import
interfaces needed for the cross-interface contract tests required by later
phases; this exception does not apply to production code.

Keep configuration at the root and keep `packages/shared` for runtime types and
utilities. The Tessera skill is documentation and creates no runtime dependency.

## TypeScript and build artifacts

Retain the scaffold's strictness, including `strict`,
`noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

Library builds emit ESM JavaScript and TypeScript declarations into `dist`.
Configure library module resolution for execution in Node.js, including explicit
JavaScript extensions in relative imports. Package exports resolve to compiled
artifacts, so consumers do not require a TypeScript runtime loader.

Initially unimplemented packages expose an empty module and compile normally.
The application packages are also minimal buildable TypeScript modules. Next.js
is introduced in Phase 7, and the documentation framework in Phase 8. Their
framework-specific configuration must preserve the shared strictness.

## Task orchestration and development

Provide root `build`, `dev`, `lint`, `typecheck`, and `test` commands through
Turborepo, along with formatting and formatting-check commands.

Each workspace has runnable build, lint, typecheck, and test scripts. Library
development uses compiler watch mode. Application development uses the same
minimal watch workflow until the application phases add their own servers.

Builds run after dependency builds and cache `dist` outputs. Typechecking and
tests wait for the compiled dependencies they resolve through package exports,
including on a checkout without existing build artifacts. Lint checks source
independently. Development tasks are persistent and uncached.

Shared configuration and the lockfile participate in cache invalidation.
Formatting checks cover the maintained source, configuration, and documentation;
generated output and dependency directories are excluded. Formatting existing
documents is mechanical and must not alter their requirements.

## Testing and failure behavior

Configure Vitest for Node.js and noninteractive test runs. Allow missing test
files explicitly while packages are unimplemented in Phase 0. Do not add dummy
assertions to make the test command green. The absence of product tests at this
stage is documented and does not claim retrieval behavior has been verified.

Starting with Phase 1, implemented behavior receives meaningful tests and cannot
rely on the foundation's no-tests allowance. Adapter tests use local fixtures,
and search tests use local snapshots. No test requires a live third-party
website. Later contract tests compare core, CLI JSON, and MCP results.

Install, formatting, lint, typecheck, test, and build failures return nonzero exit
codes and block advancement. CI must reject an out-of-date lockfile rather than
silently update it. Unsupported runtimes are declared through package engines
and installation documentation.

## CI and verification

Add a GitHub Actions workflow for pushes and pull requests. It uses Node.js 24,
the repository's pinned pnpm version, a frozen-lockfile install, formatting
checks, lint, typecheck, tests, and build. Cache dependency downloads while
keeping correctness independent of existing build artifacts.

Phase 0 is complete only when the following all succeed locally:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Also verify a frozen-lockfile install, formatting checks, emitted package
artifacts, and successful typechecking and tests without preexisting `dist`
directories. Smoke-check the development watch workflow and stop its processes
after verification. Record actual results; do not describe checks as passing
until they have run.

## Documentation and phase handoff

Update contributor and installation guidance with the runtime requirement,
setup commands, package build behavior, available checks, and the temporary
absence of product tests. Preserve the distinction between repository tooling
being complete and the Tessera product being implemented.

Use the `feat/phase-0-foundation` branch, conventional commits, and a focused
draft PR. Phase implementation commits follow successful checks. This design
document has its own documentation commit and does not claim Phase 0 is green.

Move to Phase 1 only after Phase 0 passes its checks. Continue the remaining
phases in order, with their own focused branches and PRs. Keep the accepted
local-first design, canonical validation boundary, deterministic retrieval,
safe installation guidance, and explicit unknown metadata throughout.

The repository's distribution license remains unselected, as documented in
`README.md`. Do not choose one implicitly or publish packages during Phase 0.
The publishing dry run belongs to Phase 9.
