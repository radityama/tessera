# OpenAI Codex CLI

|                   |                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                             |
| **Transport**     | stdio                                                                                    |
| **Last verified** | 2026-10-06                                                                               |
| **Official docs** | <https://developers.openai.com/codex/mcp> · <https://developers.openai.com/codex/skills> |

## Prerequisites

- Codex CLI installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

Codex reads `.codex/config.toml` **only in trusted projects**. Add:

```toml
[mcp_servers.tessera]
command = "npx"
args = ["-y", "@tessera-dev/cli", "mcp"]
```

Note the TOML table name: `mcp_servers` is **snake_case**, unlike the `mcpServers` key used by
most other harnesses.

## Global configuration

`~/.codex/config.toml`:

```toml
[mcp_servers.tessera]
command = "npx"
args = ["-y", "@tessera-dev/cli", "mcp"]
```

Or with the CLI:

```bash
codex mcp add tessera -- npx -y @tessera-dev/cli mcp
```

## How to verify the server

```bash
codex mcp list
```

Inside the TUI, `/mcp` lists active servers. If the server starts but reports missing tools,
`codex mcp --help` shows the current subcommands.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Codex loads Agent Skills from `.agents/skills/` (searched upward from the working directory) and
`~/.agents/skills/`:

```bash
mkdir -p .agents/skills/tessera && cp skills/tessera/SKILL.md .agents/skills/tessera/
```

Invoke with `/skills` or a `$` mention.

## Troubleshooting

| Symptom                  | Cause and fix                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Server not listed        | Project config is only read in trusted projects. Run `codex mcp list` and check trust.                    |
| Nothing happens on start | Confirm the TOML table is `[mcp_servers.tessera]`, not `[mcpServers.tessera]` or `[mcp.servers.tessera]`. |
| Timeouts on first launch | First `npx` run downloads the package. Raise `startup_timeout_sec` if needed.                             |

## Notes

- Windows-specific stdio caveats are **UNVERIFIED** — the official page documents none.
