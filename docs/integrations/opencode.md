# OpenCode

|                   |                                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                 |
| **Transport**     | stdio                                                                        |
| **Last verified** | 2026-10-06                                                                   |
| **Official docs** | <https://opencode.ai/docs/mcp-servers/> · <https://opencode.ai/docs/config/> |

## Prerequisites

- OpenCode installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

`opencode.json` at the project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "tessera": {
      "type": "local",
      "command": ["npx", "-y", "@tessera-dev/cli", "mcp"],
      "enabled": true
    }
  }
}
```

Two differences from most harnesses: the top-level key is **`mcp`**, not `mcpServers`, and
`command` is an **array** containing the program and its arguments.

## Global configuration

`~/.config/opencode/opencode.json`, same shape. Project config overrides global.

## How to verify the server

```bash
opencode mcp list
```

Also useful: `opencode mcp debug tessera`.

MCP tools become available to the model alongside its built-in tools; there is no separate
"list tools" command, so ask for one explicitly to confirm.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

OpenCode loads `SKILL.md` bundles from `.opencode/skills/<name>/` and `~/.config/opencode/skills/<name>/`,
and also reads `.claude/skills/` and `.agents/skills/`.

## Troubleshooting

| Symptom                | Cause and fix                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Server silently absent | `command` must be an array. `"command": "npx ..."` as a string is invalid.                                  |
| Tool calls time out    | The default tool-fetch timeout is 5s. The first `npx` run downloads the package; raise `timeout`.           |
| Context pressure       | MCP servers add tool definitions to context. Use OpenCode's per-tool globs to disable what you do not need. |

## Notes

- The docs warn that MCP servers add context; Tessera exposes six tools, which is small, but
  disable unused ones if your context is tight.
