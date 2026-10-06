# Zed

|                   |                                                                  |
| ----------------- | ---------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                     |
| **Transport**     | stdio                                                            |
| **Last verified** | 2026-10-06                                                       |
| **Official docs** | <https://zed.dev/docs/ai/mcp> · <https://zed.dev/docs/ai/skills> |

## Prerequisites

- Zed installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

`.zed/settings.json` at the project root:

```json
{
  "context_servers": {
    "tessera": {
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"]
    }
  }
}
```

Zed's key is **`context_servers`** — not `mcpServers` or `servers`. Project settings only override
a subset of settings, so if this has no effect put the config in the user file.

## Global configuration

`~/.config/zed/settings.json` (`%APPDATA%\Zed\settings.json` on Windows):

```json
{
  "context_servers": {
    "tessera": {
      "command": "npx",
      "args": ["-y", "@tessera-dev/cli", "mcp"]
    }
  }
}
```

Or via the UI: Settings → AI → MCP Servers → **Add Server** → **Add Local Server**.

## How to verify the server

Settings → AI → MCP Servers shows a status dot: green means active. The tool list reloads
automatically when a server reports `notifications/tools/list_changed`.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Zed loads `SKILL.md` bundles from `~/.agents/skills/` (global) and `<project>/.agents/skills/`
(project, trusted worktrees only). Skill directories use a flat layout — no nested folders.

## Troubleshooting

| Symptom                 | Cause and fix                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Server ignored          | The key must be `context_servers`. `mcpServers` does nothing in Zed.                      |
| Project config ignored  | Project skills are excluded until the worktree is trusted.                                |
| Tool prompts every call | Configure `agent.tool_permissions.default`; per-tool keys are `mcp:<server>:<tool_name>`. |
| Skill too large         | Zed applies a 50KB budget across the whole skill catalogue. Tessera's skill is small.     |

## Notes

- Zed supports MCP **tools and prompts**, but **not resources**. Tessera exposes tools only, so
  nothing is lost.
- Zed has no documented CLI for adding servers.
