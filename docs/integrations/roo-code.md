# Roo Code

|                   |                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                                                                      |
| **Transport**     | stdio                                                                                                                             |
| **Last verified** | 2026-10-06                                                                                                                        |
| **Official docs** | <https://roocodeinc.github.io/Roo-Code/features/mcp/using-mcp-in-roo/> · <https://roocodeinc.github.io/Roo-Code/features/skills/> |

## Prerequisites

- Roo Code (VS Code extension) installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

`.roo/mcp.json` at the project root:

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

Commit it to share Tessera with the team. Project config overrides global on a duplicate name.

In the UI: Roo Code pane → MCP servers icon → **Edit Project MCP**.

## Global configuration

Global `mcp_settings.json`, reached through **Edit Global MCP** in the same panel. The docs do not
state its absolute path, so open it through the UI.

## How to verify the server

The MCP server panel lists each server and its tools. Roo calls them through `use_mcp_tool`, so
ask for a search to confirm end to end.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Roo Code supports Agent Skills. Project: `.roo/skills/<name>/` and `.agents/skills/<name>/`.
Global: `~/.roo/skills/<name>/` and `~/.agents/skills/<name>/`. Priority is project over global,
and `.roo/` over `.agents/`.

```bash
mkdir -p .roo/skills/tessera && cp skills/tessera/SKILL.md .roo/skills/tessera/
```

## Troubleshooting

| Symptom                          | Cause and fix                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Server fails to start on Windows | Roo's docs note that Windows stdio servers need a shell wrapper: `{"command": "cmd", "args": ["/c", "npx", "-y", "@tessera-dev/cli", "mcp"]}`. |
| Timeouts on first launch         | The default timeout is 60s. The first `npx` run downloads the package.                                                                         |
| Tools listed but unused          | Install the skill, or use the example prompt.                                                                                                  |

## Notes

- `type` may be omitted for stdio entries and defaults to `"stdio"`. For URL-based servers it is
  required — an omission there fails immediately rather than falling back.
