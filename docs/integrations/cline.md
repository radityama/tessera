# Cline

|                   |                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                              |
| **Transport**     | stdio                                                                                     |
| **Last verified** | 2026-10-06                                                                                |
| **Official docs** | <https://docs.cline.bot/mcp/mcp-overview> · <https://docs.cline.bot/customization/skills> |

## Prerequisites

- Cline installed (VS Code extension, CLI, or SDK)
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

**Not verified.** Cline's project `.cline/` tree documents rules, skills, hooks and agents, but no
MCP settings file, and the current docs describe MCP configuration globally. Treat MCP as global
for Cline.

## Global configuration

Cline's MCP settings are shared across the VS Code extension, the CLI and the SDK. The docs give
two locations; `~/.cline/data/settings/cline_mcp_settings.json` is the canonical settings store.

```json
{
  "mcpServers": {
    "tessera": {
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Or via the UI: Cline panel → **MCP Servers** icon → **Configure** tab → **Configure MCP Servers**.

CLI: `cline mcp` opens an interactive wizard; `cline config mcp --json` lists servers.

## How to verify the server

The MCP Servers panel shows configured servers and their tools, and lets you restart or disable
each one. Test with a single tool call — ask Cline to search for a component.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Cline loads `SKILL.md` bundles from `.cline/skills/` (project), `.clinerules/skills/`,
`.claude/skills/`, and `~/.cline/skills/` (global).

## Troubleshooting

| Symptom                       | Cause and fix                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Settings file not found       | Open it through **Configure MCP Servers** rather than guessing the path; the docs list two candidates. |
| Server runs but is never used | Install the skill or use the example prompt.                                                           |
| Tool auto-approval            | `autoApprove` starts empty, so Cline asks before each call. Add tool names to approve in advance.      |

## Notes

- Cline's docs state a **global skill takes precedence over a same-named project skill**, the
  inverse of the usual convention. Worth confirming against your installed version.
- MCP servers and `autoApprove` run unsandboxed. Tessera never executes or installs anything, so
  approving its tools is low-risk, but that is a property of Tessera rather than of MCP.
