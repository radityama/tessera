# Gemini CLI

|                   |                                               |
| ----------------- | --------------------------------------------- |
| **Status**        | config-verified (harness not installed here)  |
| **Transport**     | stdio                                         |
| **Last verified** | 2026-10-06                                    |
| **Official docs** | <https://geminicli.com/docs/tools/mcp-server> |

## Prerequisites

- Gemini CLI installed
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

`.gemini/settings.json` at the project root:

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

Or with the CLI, which defaults to project scope:

```bash
gemini mcp add tessera npx -y @tessera-dev/cli mcp
```

## Global configuration

`~/.gemini/settings.json`, same shape. `gemini mcp add --scope user ...` writes it.

## How to verify the server

```
/mcp
```

Inside a session this lists servers with their status, tools, resources and prompts. From a shell,
`gemini mcp list`.

**A stdio server shows "Connected" only if the folder is trusted.** Run `gemini trust` if it stays
disconnected.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

Gemini CLI supports Agent Skills. Workspace: `.gemini/skills/` or `.agents/skills/`. User:
`~/.gemini/skills/` or `~/.agents/skills/`. Manage with `/skills` or `gemini skills list`.

## Troubleshooting

| Symptom                        | Cause and fix                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Server shows disconnected      | The folder is not trusted. Run `gemini trust`.                                                                                             |
| Server missing or misbehaving  | Do not use underscores in the server name — Gemini's policy parser splits on the first `_`. `tessera` is safe; `tessera_mcp` would not be. |
| Tool names look odd            | Gemini namespaces tools as `mcp_{server}_{tool}`, so `search_components` appears as `mcp_tessera_search_components`.                       |
| Environment variables redacted | Env vars are auto-redacted unless explicitly declared in the server's `env` block. Tessera needs none.                                     |

## Notes

- Gemini strips `$schema` and `additionalProperties` from tool schemas. Tessera's schemas do not
  rely on either.
