# Installation

Tessera is a local tool. There is no account, no hosted service and no telemetry. Search runs
entirely offline against a snapshot bundled with the package; only `tessera fetch` reaches the
network.

## Requirements

- Node.js **20 or later**
- npm, pnpm or npx

## Try it without installing

```bash
npx -y @tessera-dev/cli search "dark technical terminal hero"
```

## Install

```bash
npm install -g @tessera-dev/cli     # npm
pnpm add -g @tessera-dev/cli        # pnpm
```

Or as a project dependency, then use `npx tessera`:

```bash
npm install --save-dev @tessera-dev/cli
```

## Verify

```bash
tessera doctor
```

```
ok    node-version: node 22.23.1 (requires >=20)
ok    registry-source: bundled
ok    registry-valid: 73 components across 5 sources
ok    registry-integrity: 0 without retrieval, 0 with unevidenced licenses
ok    mcp-server: 6 tools registered

All checks passed.
```

`doctor` verifies the runtime, which registry is in use, that every component validates, that
licenses carry evidence, and that the MCP server starts.

## Use it

```bash
tessera search "minimal saas pricing cards"
tessera inspect aceternity/terminal
tessera similar aceternity/terminal
tessera fetch magicui/terminal --output ./vendor --dry-run
```

## Connect a coding agent

```bash
tessera mcp
```

That is the whole command. Point your agent's MCP configuration at it — see
[`integrations/`](./integrations/README.md) for per-harness configuration.

## Pointing at a different registry

```bash
tessera search "hero" --registry ./my-registry
TESSERA_REGISTRIES=./my-registry tessera doctor
```

Precedence: `--registry` → `TESSERA_REGISTRIES` → a `registries/` directory found above the
current directory → the bundled snapshot. When working inside this repository, the local
`registries/` directory wins automatically.

## Building from source

```bash
git clone https://github.com/radityama/tessera
cd tessera
pnpm install
pnpm build
pnpm test
```

See [CONTRIBUTING.md](../CONTRIBUTING.md).
