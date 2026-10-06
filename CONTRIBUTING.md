# Contributing to Tessera

Tessera helps coding agents reuse real UI components instead of rebuilding them. Contributions
are welcome — with one standing constraint that shapes almost every guideline below.

## The rule that matters most

**Do not invent metadata.**

This project's first registry was fabricated: it described a library that does not exist, used
`example.com` as a real URL, and attributed licenses with no evidence — including calling
Aceternity UI "MIT" when it ships a bespoke, redistribution-restricted license.

If you cannot verify a fact, record it as unknown. `license.status: "unknown"` and
`visual.motion: "unknown"` are correct answers. A plausible guess is not.

## Setup

```bash
git clone https://github.com/radityama/tessera
cd tessera
pnpm install
pnpm build      # required before test: the registry bundle is built here
pnpm test
```

Requires Node.js 20 or later and pnpm 10.

## Architecture

```
packages/
  registry/   @tessera-dev/registry   schemas, validation, loading, bundled snapshot
  core/       @tessera-dev/core       query, ranking, score explanations, artifact retrieval
  mcp/        @tessera-dev/mcp        MCP server (thin layer over core)
  cli/        @tessera-dev/cli        the `tessera` binary (thin layer over core)
  adapters/   (private)               registry sync tooling
apps/
  web/        registry explorer
  docs/       documentation site
registries/   generated snapshots — never edit by hand
```

Dependency direction is one-way: `registry ← adapters`, `registry → core → {cli, mcp}`. Core must
not import from cli or mcp.

**Provider specifics belong in adapters.** `@tessera/core` contains no `if (source === ...)`
branches, and it should stay that way.

## Development commands

```bash
pnpm build            # all packages
pnpm lint             # eslint + prettier check
pnpm typecheck
pnpm test
pnpm format           # prettier --write
pnpm registry:sync    # refresh registry snapshots (network)
pnpm smoke:pack       # pack, install elsewhere, drive CLI + MCP
pnpm mcp:conformance  # MCP protocol suite
```

## Adding a registry source

1. **Verify the project exists.** Find its official site, docs and repository. A name matching
   search results is not evidence.
2. **Determine the retrieval mechanism.** shadcn registry, npm package, GitHub source, or
   documentation only. Record the exact endpoint — do not guess a URL pattern.
3. **Establish the license with an evidence URL.** If free and paid tiers are mixed, work out how
   to tell them apart.
4. **Add a descriptor** to `packages/adapters/src/sources.ts`.
5. **Run `pnpm registry:sync`** and review the diff. Every added component must trace to a real
   upstream item.
6. **Update `docs/sources.md`** with the project, retrieval mechanism, license status, and what
   Tessera stores versus does not.

A source whose license or ownership cannot be verified does not go in.

## Adding a component by hand

You usually should not. Components come from `pnpm registry:sync`. Hand-editing
`registries/*/components.json` is how the fabricated data got in.

The exception is a curated source with no machine-readable registry. HeroUI is the current
example: its components are listed in `packages/adapters/src/heroui.ts`, and every entry must
correspond to a real page in the provider's own documentation. `pnpm registry:sync` then writes
the snapshot.

## Evidence requirements

Every component must carry:

- a `retrieval` entry — `{ kind: "none" }` if there is genuinely no artifact;
- `license.status: "known"` **only** with both an identifier and a `source` evidence URL, or
  `status: "unknown"` with no identifier;
- `provenance.adapter` and `provenance.retrievedAt`;
- `provenance.derivedFields` listing every field Tessera inferred rather than read from upstream.

Validation enforces the license rules, and `packages/registry/src/release-guard.test.ts` fails the
build on placeholder domains, unevidenced licenses, missing retrieval, and non-OSI licenses marked
OSI-approved.

## Tests

- Use fixtures, never live HTTP. A test that fails because a third party is down is a test
  contributors learn to ignore.
- Retrieval tests inject `fetchImpl`.
- Assert behaviour, not implementation.
- `pnpm test` must pass offline.

See [`docs/testing.md`](./docs/testing.md) for the categories.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`,
`refactor:`, `test:`.

Scope by package where it helps: `feat(core): …`, `docs(integrations): …`.

## Pull requests

Use the template. In short:

- one focused change per PR — do not mix unrelated refactors;
- describe **why**, not just what;
- state what you tested;
- record any registry or licensing impact;
- flag breaking changes explicitly.

Keep PRs reviewable. Large mechanical changes are fine; large mixed changes are not.

## Source licensing policy

Tessera indexes metadata; it does not redistribute component source.

- Never commit third-party component source to this repository.
- Never claim a license you cannot evidence.
- Never mark unknown-license code as safe to vendor.
- A license may be known and still forbid redistribution. Record both `status` and
  `redistribution`.

## Reporting bugs and requesting features

Use the issue forms. For anything security-related, follow [`SECURITY.md`](./SECURITY.md) instead
of opening a public issue.

## Code of conduct

Participation is covered by [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
