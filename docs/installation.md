# Installation

v0.1 is local-first: search works against the curated registry snapshot in this repository. No network access is required.

## Prerequisites

- Node.js >= 20
- pnpm >= 10

## Install workspace dependencies

```bash
pnpm install
```

## Build all packages

```bash
pnpm build
```

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Use the CLI from source

```bash
node packages/cli/dist/cli.js search "dark technical terminal hero" --limit 5
node packages/cli/dist/cli.js inspect beautifului/terminal-hero
node packages/cli/dist/cli.js similar beautifului/terminal-hero --limit 3
node packages/cli/dist/cli.js add beautifului/terminal-hero --dry-run
```

`add` is safe by default: in v0.1 it only prints a plan. Automatic mutation is not implemented.

## Point the CLI at a registry snapshot

By default the CLI walks up from the current directory to find `registries/`. Override with:

```bash
node packages/cli/dist/cli.js search "hero" --registry ./registries
# or
TESSERA_REGISTRIES=./registries node packages/cli/dist/cli.js search "hero"
```

## Run the MCP server

```bash
node packages/mcp/dist/index.js
```

The server speaks MCP over stdio and exposes `search_components`, `get_component`, `get_installation`, `find_similar_components`, and `search_patterns`. It never executes shell commands.

## Browse locally

```bash
pnpm --filter @tessera/web build
pnpm --filter @tessera/docs build
```

Open `apps/web/dist/index.html` (registry explorer) and `apps/docs/dist/index.html` (documentation site).
