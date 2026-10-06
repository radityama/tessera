# Compatibility matrix

All rows checked against each harness's **current official documentation** on **2026-10-06**. No
row claims more than was actually established.

`Runtime tested` means Tessera was registered with the harness and its tools were observed
working. `Config verified` means the configuration was checked against official docs but the
harness was not available to run here.

| Harness         | MCP transport | Project config                                              | Global config                                    | Skill support                          | Runtime tested           | Config verified | Last verified | Notes                                                          |
| --------------- | ------------- | ----------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- | ------------------------ | --------------- | ------------- | -------------------------------------------------------------- |
| Claude Code     | stdio         | `.mcp.json` (`mcpServers`)                                  | `~/.claude.json` (`mcpServers`)                  | `.claude/skills/`                      | **yes** — `✔ Connected`  | yes             | 2026-10-06    | Project servers need approval.                                 |
| Codex CLI       | stdio         | `.codex/config.toml` (`[mcp_servers.x]`, trusted projects)  | `~/.codex/config.toml`                           | `.agents/skills/`                      | no                       | yes             | 2026-10-06    | TOML table is snake_case.                                      |
| Cursor          | stdio         | `.cursor/mcp.json` (`mcpServers`)                           | `~/.cursor/mcp.json`                             | `.cursor/skills/`, `.agents/skills/`   | no                       | yes             | 2026-10-06    | Project config wins on name clash.                             |
| Windsurf        | stdio         | not supported                                               | `~/.config/devin/mcp_config.json`                | `.devin/skills/`                       | no                       | yes             | 2026-10-06    | Docs mid-migration; legacy `codeium/windsurf` path unverified. |
| OpenCode        | stdio         | `opencode.json` (`mcp`)                                     | `~/.config/opencode/opencode.json`               | `.opencode/skills/`, `.agents/skills/` | no                       | yes             | 2026-10-06    | `command` is an array; key is `mcp`.                           |
| Cline           | stdio         | not verified                                                | `~/.cline/data/settings/cline_mcp_settings.json` | `.cline/skills/`                       | no                       | yes             | 2026-10-06    | Two global paths in docs.                                      |
| Roo Code        | stdio         | `.roo/mcp.json` (`mcpServers`)                              | `mcp_settings.json` via UI                       | `.roo/skills/`, `.agents/skills/`      | no                       | yes             | 2026-10-06    | Windows needs `cmd /c`.                                        |
| VS Code Copilot | stdio         | `.mcp.json` (`mcpServers`) · `.vscode/mcp.json` (`servers`) | MCP: Open User Configuration                     | `.github/skills/`, `.agents/skills/`   | no                       | yes             | 2026-10-06    | `.vscode/mcp.json` deprecated.                                 |
| Gemini CLI      | stdio         | `.gemini/settings.json` (`mcpServers`)                      | `~/.gemini/settings.json`                        | `.gemini/skills/`, `.agents/skills/`   | no                       | yes             | 2026-10-06    | Needs `gemini trust`; no underscores in server name.           |
| Zed             | stdio         | `.zed/settings.json` (`context_servers`)                    | `~/.config/zed/settings.json`                    | `.agents/skills/`                      | no                       | yes             | 2026-10-06    | Key is `context_servers`; no resources.                        |
| Continue        | stdio         | `.continue/mcpServers/*.yaml`                               | `~/.continue/config.yaml`                        | **unverified**                         | no                       | yes             | 2026-10-06    | `mcpServers` is a YAML array.                                  |
| Any MCP client  | stdio         | —                                                           | —                                                | —                                      | **yes** — protocol suite | yes             | 2026-10-06    | See `generic-mcp.md`.                                          |

## What "runtime tested" required

For Claude Code: `claude mcp add` registered the server, and `claude mcp list` reported
`✔ Connected`. The server launched there is the same binary the packaging smoke test exercises, so
the connection is not the only evidence — `scripts/mcp-conformance.mjs` separately verifies the
protocol behaviour that every client depends on.

The other harnesses were not installed in the environment where this was prepared. Claiming they
work because they advertise MCP support would be exactly the kind of unfounded assertion this
project has already had to clean up once, so they are marked `config verified` instead.

## Correcting this table

If you run Tessera against a harness listed as `config verified`, please open an issue with the
harness version, the config you used and what you observed. That is the only way a row moves to
`runtime tested`.
