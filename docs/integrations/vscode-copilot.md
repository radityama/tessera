# VS Code / GitHub Copilot

|                   |                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                                                                          |
| **Transport**     | stdio                                                                                                                                 |
| **Last verified** | 2026-10-06                                                                                                                            |
| **Official docs** | <https://code.visualstudio.com/docs/copilot/chat/mcp-servers> · <https://code.visualstudio.com/docs/agent-customization/agent-skills> |

## Prerequisites

- VS Code with GitHub Copilot Chat
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

VS Code has two workspace formats, and **they use different top-level keys**. This catches people
out.

`.vscode/mcp.json` uses **`servers`**:

```json
{
  "servers": {
    "tessera": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"]
    }
  }
}
```

`.mcp.json` at the project root uses **`mcpServers`**, and is the portable format VS Code now
recommends over the deprecated `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "tessera": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"]
    }
  }
}
```

## Global configuration

Command Palette → **MCP: Open User Configuration**, or the portable file at
`$COPILOT_HOME/mcp-config.json` (falling back to `~/.copilot/mcp-config.json`), which uses
`mcpServers`.

Alternatively:

```bash
code --add-mcp '{"name":"tessera","command":"npx","args":["-y","@tessera-dev/cli","mcp"]}'
```

## How to verify the server

- Command Palette → **MCP: List Servers** (start, stop, inspect logs).
- **Configure Tools** in the chat input lists the server's tools.
- **MCP: Browse Resources** lists any resources the server exposes.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

VS Code loads Agent Skills from `.github/skills/`, `.agents/skills/` and `.claude/skills/` in the
project, and from `~/.copilot/skills/`, `~/.agents/skills/` and `~/.claude/skills/` globally:

```bash
mkdir -p .github/skills/tessera && cp skills/tessera/SKILL.md .github/skills/tessera/
```

## Troubleshooting

| Symptom                           | Cause and fix                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Server not detected               | `.vscode/mcp.json` uses `servers`; `.mcp.json` uses `mcpServers`. Mixing them up silently registers nothing. |
| Not read in an Agent Host session | `.vscode/mcp.json` is not read there. Use `.mcp.json` or the user-level file.                                |
| Workspace servers ignored         | Workspace MCP servers inherit Workspace Trust. Trust the folder.                                             |
| Remote/SSH failures               | The stdio sandbox is macOS and Linux only, not Windows.                                                      |

## Notes

- Copilot supports MCP **prompts and resources** in addition to tools, so a server may surface more
  than tools. Tessera exposes tools only, by design.
- `.vscode/mcp.json` is deprecated in favour of the portable `.mcp.json`.
