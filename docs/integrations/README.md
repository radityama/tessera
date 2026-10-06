# Coding-agent integrations

Tessera is a local stdio MCP server with no authentication and no remote endpoint, so it works
with any standards-compliant MCP client. The pages here document the harnesses we have checked.

**The command is always the same:**

```bash
npx -y @tessera-dev/cli mcp
```

Nothing needs to be installed globally and no path into a checkout is involved.

## Status legend

| Status               | Meaning                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **runtime-verified** | Tessera was registered with the harness and its tools were observed working.                                              |
| **config-verified**  | The configuration was checked against the harness's current official docs, but the harness was not available to run here. |
| **documented**       | Researched only.                                                                                                          |

We do not claim a harness "works" because it advertises MCP support. Every page states which of
the above applies, with the date and the official documentation it was checked against.

## Harnesses

| Harness                                | Transport | Project config                                         | Global config                                    | Skill support                          | Status                |
| -------------------------------------- | --------- | ------------------------------------------------------ | ------------------------------------------------ | -------------------------------------- | --------------------- |
| [Claude Code](./claude-code.md)        | stdio     | `.mcp.json` `mcpServers`                               | `~/.claude.json`                                 | `.claude/skills/`                      | **runtime-verified**  |
| [Codex CLI](./codex.md)                | stdio     | `.codex/config.toml` `[mcp_servers.x]`                 | `~/.codex/config.toml`                           | `.agents/skills/`                      | config-verified       |
| [Cursor](./cursor.md)                  | stdio     | `.cursor/mcp.json` `mcpServers`                        | `~/.cursor/mcp.json`                             | `.cursor/skills/`, `.agents/skills/`   | config-verified       |
| [Windsurf](./windsurf.md)              | stdio     | not supported                                          | `~/.config/devin/mcp_config.json`                | `.devin/skills/`                       | config-verified       |
| [OpenCode](./opencode.md)              | stdio     | `opencode.json` `mcp`                                  | `~/.config/opencode/opencode.json`               | `.opencode/skills/`, `.agents/skills/` | config-verified       |
| [Cline](./cline.md)                    | stdio     | not verified                                           | `~/.cline/data/settings/cline_mcp_settings.json` | `.cline/skills/`                       | config-verified       |
| [Roo Code](./roo-code.md)              | stdio     | `.roo/mcp.json` `mcpServers`                           | `mcp_settings.json` via UI                       | `.roo/skills/`, `.agents/skills/`      | config-verified       |
| [VS Code Copilot](./vscode-copilot.md) | stdio     | `.mcp.json` `mcpServers`, `.vscode/mcp.json` `servers` | MCP: Open User Configuration                     | `.github/skills/`, `.agents/skills/`   | config-verified       |
| [Gemini CLI](./gemini-cli.md)          | stdio     | `.gemini/settings.json` `mcpServers`                   | `~/.gemini/settings.json`                        | `.gemini/skills/`, `.agents/skills/`   | config-verified       |
| [Zed](./zed.md)                        | stdio     | `.zed/settings.json` `context_servers`                 | `~/.config/zed/settings.json`                    | `.agents/skills/`                      | config-verified       |
| [Continue](./continue.md)              | stdio     | `.continue/mcpServers/*.yaml`                          | `~/.continue/config.yaml`                        | unverified                             | config-verified       |
| [Any MCP client](./generic-mcp.md)     | stdio     | —                                                      | —                                                | via project rules                      | **protocol-verified** |

The key names genuinely differ — `mcpServers`, `servers`, `mcp`, `context_servers`, and a TOML
`mcp_servers` table. Each page states the correct one, checked against that harness's own docs.

The machine-readable version of this table lives in [compatibility.md](./compatibility.md).

## Harnesses without MCP support

If a harness cannot speak MCP, Tessera is still usable: the CLI covers the same ground, and
[`generic-mcp.md`](./generic-mcp.md#project-rules-instead-of-a-skill) describes the project-rule
snippet that gives an agent the same instructions the skill would.

## Verifying any harness yourself

```bash
tessera doctor                        # registry, schema, license evidence, MCP startup
tessera mcp                           # the same server your harness will launch
node scripts/mcp-conformance.mjs      # full protocol test: tools, errors, shutdown
```
