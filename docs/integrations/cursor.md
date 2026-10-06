# Cursor

|                   |                                                                  |
| ----------------- | ---------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                     |
| **Transport**     | stdio                                                            |
| **Last verified** | 2026-10-06                                                       |
| **Official docs** | <https://cursor.com/docs/mcp> · <https://cursor.com/docs/skills> |

## Prerequisites

- Cursor installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

`.cursor/mcp.json` at the project root:

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

Commit it to share Tessera with the team. Cursor merges project and global config; on a duplicate
server name the project file wins.

## Global configuration

`~/.cursor/mcp.json`, same shape.

## How to verify the server

- **Customize → MCPs** lists configured servers and lets you toggle them.
- Connected tools appear under **Available Tools** in chat.
- Logs: Output panel (`Ctrl/Cmd+Shift+U`) → **MCP Logs**.

Restart Cursor after editing `mcp.json`.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Cursor auto-loads Agent Skills from `.cursor/skills/` and `.agents/skills/` in the project, and
from `~/.cursor/skills/` and `~/.agents/skills/` globally. It also reads `.claude/skills/` and
`.codex/skills/` for compatibility:

```bash
mkdir -p .cursor/skills/tessera && cp skills/tessera/SKILL.md .cursor/skills/tessera/
```

## Troubleshooting

| Symptom                     | Cause and fix                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Server missing after edit   | Cursor caches MCP config at startup. Restart Cursor.                                                                 |
| `npx: command not found`    | Cursor inherits the GUI `PATH`, which may not include nvm or pnpm shims. Use an absolute path to `npx` in `command`. |
| Tools listed but never used | Install the skill, or ask explicitly — see the example prompt.                                                       |

## Notes

- The docs' field table marks `type` as required for stdio entries, while the worked examples omit
  it. Omitting it works in practice; add `"type": "stdio"` if your version requires it.
- No `cursor mcp add` CLI command is documented — configuration is by file, UI, or an Extension
  API.
