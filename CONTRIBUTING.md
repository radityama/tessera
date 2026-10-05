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
