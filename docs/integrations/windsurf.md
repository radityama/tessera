# Windsurf

|                   |                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                            |
| **Transport**     | stdio                                                                                   |
| **Last verified** | 2026-10-06                                                                              |
| **Official docs** | <https://docs.devin.ai/desktop/cascade/mcp> (Windsurf's Cascade docs now redirect here) |

## Prerequisites

- Windsurf installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

**Not supported for MCP.** Windsurf documents only a global/user MCP config, so the example below
goes in the global file.

## Global configuration

`~/.config/devin/mcp_config.json` (or `$XDG_CONFIG_HOME/devin/mcp_config.json`; `%APPDATA%\devin\mcp_config.json`
on Windows):

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

Alternatively: Cascade panel → **…** (Actions) → **Open MCP config file** in the MCPs section.

## How to verify the server

The **MCPs** section of the **…** menu lists configured servers and how many tools each has
enabled. There is a hard cap of **100 tools** across all servers.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Windsurf supports Agent Skills. Workspace: `.devin/skills/<name>/SKILL.md` (legacy
`.windsurf/skills/`). Global: `~/.config/devin/skills/` or `~/.codeium/windsurf/skills/`. It also
discovers `.agents/skills/` and `.claude/skills/`.

## Troubleshooting

| Symptom                   | Cause and fix                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Config file has no effect | There is no project-scoped MCP file. Put the config in the global path.                                                                                            |
| Server blocked            | Enterprise allowlisting: once any server is allowlisted, non-allowlisted servers are blocked by command pattern.                                                   |
| Server missing entirely   | Old guides point at `~/.codeium/windsurf/mcp_config.json`. The current docs use the `devin` path; the legacy location is **UNVERIFIED** and may no longer be read. |

## Notes

- These pages are mid-migration from Windsurf to Devin Desktop docs. If the path above does not
  exist on your install, check the current official page rather than an older guide.
- The new default Devin Local agent uses Devin CLI config files instead of the Cascade config.
