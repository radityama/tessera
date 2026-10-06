<div align="center">

# Tessera

**UI retrieval for coding agents.**

Search, inspect, and reuse real interface components from existing UI libraries
before generating them from scratch.

[![CI](https://github.com/radityama/tessera/actions/workflows/ci.yml/badge.svg)](https://github.com/radityama/tessera/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](./docs/installation.md)
[![MCP](https://img.shields.io/badge/MCP-stdio-8a2be2.svg)](./docs/integrations/README.md)

</div>

---

Coding agents write a lot of UI from scratch that already exists, and it shows. A pricing section,
a terminal hero, a command palette — these are solved problems sitting in five different component
libraries, each with its own docs site and its own copy-paste instructions.

Tessera gives an agent a way to search those libraries, see _why_ a component ranked where it did,
check the licence and dependencies, and pull the real source. One command, no account, no network
call until you actually fetch something.

The rule the project is built around:

> **Reuse composition, not identity.**

Take the structure, drop the branding. A retrieved component gets adapted to your design language,
never shipped as the library's demo.

## Why

An agent asked to "build a dark developer-tool hero" will happily write one from nothing, badly,
while `aceternity/terminal` and `magicui/terminal` sit two searches away. The gap is not that good
components are missing — it is that nothing tells the agent they exist in a form it can act on.

Tessera fills that gap without becoming a design system, a hosted service, or a build step. It is a
local index with an honest licence record and a fetch command.

## What it looks like

```console
$ tessera search "dark technical terminal hero"

1. magicui/terminal — Terminal (0.612)
   category: terminal | source: magicui | frameworks: react
   motion: unknown | deps: 0 | license: MIT, OSI-approved, redistribution permitted
   artifact: retrievable (shadcn-registry)
   why: exact category match: terminal; matches aesthetics: terminal; no required runtime dependencies

$ tessera fetch aceternity/terminal

aceternity/terminal — 1 file(s) from aceternity
upstream: https://ui.aceternity.com/registry/terminal.json
license: LicenseRef-Aceternity, not OSI-approved, redistribution restricted
files:
  components/ui/terminal.tsx (13977 bytes)

! This license permits use but restricts redistributing the source files.
  Adapt it into your project; do not republish it as a component library.

Tessera wrote these files only because you asked. Nothing was installed or executed.
```

## Quick start

```bash
npx -y @tessera-dev/cli search "dark technical terminal hero"
```

Install it if you want it around:

```bash
npm install -g @tessera-dev/cli
tessera doctor
```

`doctor` checks the runtime, which registry is loaded, that every component validates, that
licences carry evidence, and that the MCP server starts.

## CLI

```bash
tessera search "<query>"        # rank components; works offline
tessera inspect <id>            # full metadata, licence and provenance
tessera similar <id>            # alternatives
tessera add <id> --dry-run      # what installing it would involve
tessera fetch <id>              # retrieve the real source
tessera mcp                     # start the MCP server
tessera doctor                  # diagnose the installation
```

Only `fetch` and `mcp` reach the network, and only when you ask. See [`docs/cli.md`](./docs/cli.md).

## MCP

```bash
npx -y @tessera-dev/cli mcp
```

Six tools, stable names:

| Tool                      | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `search_components`       | Rank components for a query, with score explanations.     |
| `get_component`           | Full canonical metadata for one id.                       |
| `get_component_artifact`  | Fetch the real upstream source, dependencies and licence. |
| `get_installation`        | A safe installation plan.                                 |
| `find_similar_components` | Alternatives by category, aesthetics, motion and stack.   |
| `search_patterns`         | Higher-level UI patterns rather than exact names.         |

Configure it once:

```json
{
  "mcpServers": {
    "tessera": {
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"]
    }
  }
}
```

The key name differs per harness — `mcpServers`, `servers`, `mcp`, `context_servers`, or a TOML
`[mcp_servers.x]` table. Each has a page in [`docs/integrations/`](./docs/integrations/README.md),
checked against that harness's own current documentation.

## Agent Skill

[`skills/tessera/SKILL.md`](./skills/tessera/SKILL.md) teaches an agent the workflow, not just the
tools: decompose the page, decide the design language, search, read the score reasons, check the
licence, retrieve, adapt, then run a cohesion pass. It explicitly tells the agent to **reject a
highly ranked component that clashes with the page**, because "call `search_components` and paste
rank #1" produces exactly the incoherent result Tessera exists to prevent.

Install it where your harness looks for skills, or use the project-rule snippet for harnesses that
have no skill support.

## Example workflow

```text
"Build a dark developer-tool landing page with a technical hero and a terminal."

  decompose → hero, feature grid, pricing, footer
  design language → dark, 12px radius, hairline borders, low motion
  search_components "dark technical hero terminal subtle motion"
  → 5 candidates with scores and reasons
  inspect aceternity/terminal → LicenseRef-Aceternity, redistribution restricted
  get_component_artifact magicui/terminal → real files + deps + MIT
  adapt → swap the palette for the project's tokens, drop the demo copy
  cohesion pass → the top-ranked hero clashes on radius; take the second
```

## How retrieval works

Search and retrieval are deliberately separate.

```text
provider registry  →  pnpm registry:sync  →  pinned snapshot  →  local search
                                                               ↘
                                                                 fetch on request
```

Search never touches the network, so it is deterministic and testable offline. `fetch` is the only
network path: it resolves the upstream URL **from the registry, never from the caller**, validates
every redirect against an allowlist of hosts the registry already advertises, caps the response
size, and validates the payload before returning it. Retrieved code is never executed, written
unprompted, or installed.

See [`docs/retrieval.md`](./docs/retrieval.md).

## Supported sources

| Source        | Components | Retrieval       | Licence                                                     |
| ------------- | ---------- | --------------- | ----------------------------------------------------------- |
| Aceternity UI | 8          | shadcn registry | Bespoke `LicenseRef-Aceternity` — redistribution restricted |
| beUI          | 15         | shadcn registry | MIT                                                         |
| Efferd        | 20         | shadcn registry | MIT where in the open-source repo, otherwise unknown        |
| Magic UI      | 18         | shadcn registry | MIT                                                         |
| HeroUI        | 12         | npm package     | MIT                                                         |

Every record traces to a real upstream item. Licences carry an evidence URL or are recorded as
`unknown` — a `known` licence without evidence fails validation and the build. The registry has no
hand-written entries; `pnpm registry:sync` generates it.

Sources and their evidence: [`docs/sources.md`](./docs/sources.md).

## Supported coding agents

Claude Code is runtime-verified. Ten more are config-verified against their current official docs,
and the compatibility matrix marks the difference rather than claiming universal support.

[Claude Code](./docs/integrations/claude-code.md) ·
[Codex](./docs/integrations/codex.md) ·
[Cursor](./docs/integrations/cursor.md) ·
[Windsurf](./docs/integrations/windsurf.md) ·
[OpenCode](./docs/integrations/opencode.md) ·
[Cline](./docs/integrations/cline.md) ·
[Roo Code](./docs/integrations/roo-code.md) ·
[VS Code Copilot](./docs/integrations/vscode-copilot.md) ·
[Gemini CLI](./docs/integrations/gemini-cli.md) ·
[Zed](./docs/integrations/zed.md) ·
[Continue](./docs/integrations/continue.md) ·
[any MCP client](./docs/integrations/generic-mcp.md)

## Architecture

```text
registry ← adapters
   ↑
 core ──→ cli
   │      mcp
   └──→ web explorer
```

Dependency direction is one-way. `core` contains no provider-specific branches — provider behaviour
lives in adapters, and ranking stays provider-neutral. The CLI, MCP and explorer all call the same
`searchRegistry`; a parity test fails the build if the explorer's bundled copy ever diverges.

## Safety and licensing

- Tessera indexes metadata. **It does not store or redistribute component source.**
- Every licence carries evidence or is marked `unknown`. Unknown licences rank lower and warn.
- `status` and `redistribution` are separate, because a licence can be known and still forbid reuse.
- `fetch` never overwrites a file silently, and rejects upstream paths that escape the output
  directory.
- No shell execution, no dependency installation, no telemetry.

See [`SECURITY.md`](./SECURITY.md) and [`docs/security-licensing.md`](./docs/security-licensing.md).

## Development

```bash
pnpm install
pnpm build          # required before test: the registry bundle is built here
pnpm test
pnpm release:check  # the full gate
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). The one rule that matters most: **do not invent
metadata.** Unknown is a correct answer; a plausible guess is not.

## Roadmap

v0.1 proves the local loop. Deliberately excluded: embeddings, vector search, a hosted index,
automatic installation, screenshot similarity.

See [`docs/roadmap.md`](./docs/roadmap.md).

## License

[MIT](./LICENSE).

Tessera is not affiliated with any of the component libraries it indexes. Their names and links
identify where metadata comes from, nothing more.
