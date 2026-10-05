# Tessera

**UI retrieval for coding agents.**

Tessera helps coding agents discover, evaluate, fetch, adapt, and compose high-quality UI components from multiple component libraries instead of rebuilding every visually significant interface from scratch.

The core idea is simple:

> Reuse composition, not identity.

A coding agent should search for good existing UI patterns first, choose components that fit the product's visual language, then adapt them to the local design system rather than copy-pasting a library demo unchanged.

## Status

The repository foundation and Phase 1 canonical registry are implemented. The registry validates and loads local snapshots and bundles 20 reviewed component records across five sources. Retrieval, CLI, MCP, and application behavior are not implemented yet.

## Local development

Use Node.js 24 or newer. The repository pins pnpm 10.34.6 through `packageManager`. If Corepack is unavailable, install it with `npm install -g corepack` ([Corepack installation](https://github.com/nodejs/corepack#manual-installs)). With Corepack available, run `corepack enable`, then `pnpm install`.

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before submitting a change. Use `pnpm format` to format maintained files and `pnpm dev` for compiler watch mode in all eight workspaces.

Library builds emit ESM JavaScript and declarations to `dist`. Applications are currently empty buildable modules; their web servers arrive in Phases 7 and 8. Product searches and installation commands are not available yet.

Start with [`START_HERE.md`](./START_HERE.md), then read [`AGENTS.md`](./AGENTS.md).

## Product Shape

Tessera is composed of four layers:

1. **Skill** — teaches an agent when to search for reusable UI and how to keep visual cohesion.
2. **Registry** — normalizes component metadata from many UI libraries into one schema.
3. **Core retrieval engine** — searches, filters, scores, and ranks component candidates.
4. **MCP + CLI** — exposes retrieval and installation workflows to coding agents and humans.

```text
User request
   ↓
Coding agent
   ↓
Tessera Skill
   ↓
UI decomposition + visual intent
   ↓
Tessera retrieval engine
   ↓
Unified registry
   ├── Aceternity UI
   ├── Beautiful UI
   ├── BeUI
   ├── HeroUI
   ├── Efferd
   └── future sources
   ↓
Ranked candidates
   ↓
Fetch source + installation metadata
   ↓
Adapt to project design system
   ↓
Cohesion / accessibility / responsive pass
   ↓
Production UI
```

## Initial Scope

v0.1 should prove one thing:

> When a coding agent is asked to build UI, Tessera can help it find a better existing component, understand how to use it, and adapt it into a cohesive final interface.

Do not overbuild v0.1. No vector database, screenshot embeddings, crawler farm, hosted control plane, or AI model is required initially.

Use curated registry data and deterministic ranking first.

## Monorepo

```text
apps/
  web/              Registry explorer and product site
  docs/             Documentation site
packages/
  core/             Query parsing, filtering, scoring, ranking
  registry/         Unified schema, loaders, validation
  adapters/         Source-specific adapters
  mcp/              MCP server
  cli/              `tessera` CLI
  shared/           Shared types and utilities
skills/
  tessera/          Agent skill instructions
registries/         Source review notes for the bundled canonical metadata
docs/               Product and engineering documentation
examples/           End-to-end usage examples
```

## Suggested Stack

- TypeScript
- Node.js
- pnpm workspaces
- Turborepo
- Zod for schemas
- Vitest for unit/integration tests
- Next.js for `apps/web`
- A docs framework of the implementing agent's choice, preferably one that keeps Markdown/MDX portable
- MCP TypeScript SDK for the server
- Commander, Citty, or another lightweight CLI framework

Avoid introducing infrastructure that is not required by the current milestone.

## Non-goals

Tessera is not:

- a design-to-code model,
- a replacement for component libraries,
- a page generator that blindly stitches templates together,
- a giant copy of third-party source code,
- a design-system replacement,
- a reason to add unnecessary dependencies to user projects.

## License

No license has been selected in this scaffold. Choose one deliberately before public distribution.
