# Contributing

## Before contributing

Read:

- `AGENTS.md`
- `docs/architecture.md`
- `docs/component-model.md`
- `docs/security-licensing.md`

## Pull requests

Keep pull requests focused.

A source adapter PR should not also redesign the CLI.

## Adding a component source

A new source should include:

- adapter implementation,
- fixture data,
- adapter tests,
- canonical metadata examples,
- provenance handling,
- license metadata behavior,
- documentation update.

## Quality requirements

Changes should pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Development setup

Use Node.js 24+ and the pinned pnpm version. Run `pnpm install`; CI uses `pnpm install --frozen-lockfile`. Run `pnpm format:check` alongside the quality commands above.

Each workspace builds to `dist`, and TypeScript preserves strict optional-property and indexed-access checks. Internal dependencies use `workspace:*` when consumed. Import another package through its public export; do not reach into its source or reverse the documented dependency direction.

`pnpm dev` starts compiler watchers. Stop them with Ctrl+C. The application packages have no framework server until their assigned phases.
