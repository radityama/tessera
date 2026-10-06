# Continue

|                   |                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Status**        | config-verified (harness not installed here)                                                 |
| **Transport**     | stdio                                                                                        |
| **Last verified** | 2026-10-06                                                                                   |
| **Official docs** | <https://docs.continue.dev/customize/deep-dives/mcp> · <https://docs.continue.dev/reference> |

## Prerequisites

- Continue installed (IDE extension or `cn` CLI)
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

## Project-scoped configuration

Continue auto-discovers one YAML file per server under `.continue/mcpServers/`. Create
`.continue/mcpServers/tessera.yaml`:

```yaml
name: tessera
version: 1.0.0
schema: v1
mcpServers:
  - name: tessera
    type: stdio
    command: npx
    args:
      - "-y"
      - "@tessera-dev/cli"
      - "mcp"
```

Standalone files must include the top-level `name`, `version` and `schema` keys.

## Global configuration

`~/.continue/config.yaml` (the deprecated `config.json` is replaced by YAML):

```yaml
name: Local Config
version: 1.0.0
schema: v1
mcpServers:
  - name: tessera
    type: stdio
    command: npx
    args:
      - "-y"
      - "@tessera-dev/cli"
      - "mcp"
```

Note that `mcpServers` is a **YAML array of objects**, each with its own inline `name` — not a
map keyed by server name like most other harnesses. This is a common configuration mistake.

**Compatibility escape hatch:** a Claude/Cursor-style JSON file dropped at
`.continue/mcpServers/mcp.json` is also auto-detected, so an existing `mcpServers` map works
unchanged.

## How to verify the server

**MCP works only in Agent mode.** There is no documented tool-listing command, so verify by asking
in agent mode and confirming Tessera is called.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical and coherent.

## Skill

**UNVERIFIED.** Continue's documentation does not publish a Skills page, and a docs issue covering
skills is still open. A loader for `.continue/skills/<name>/SKILL.md` appears to exist in the
codebase, but this is not confirmed against official documentation, so treat it as unverified.

If skills are not available in your version, use the project-rules snippet in
[`generic-mcp.md`](./generic-mcp.md#project-rules-instead-of-a-skill) instead.

## Troubleshooting

| Symptom                 | Cause and fix                                                             |
| ----------------------- | ------------------------------------------------------------------------- |
| Server never used       | MCP is available only in Agent mode, not Chat, Plan or autocomplete.      |
| Config ignored          | `mcpServers` must be an array here. A map-shaped entry parses as invalid. |
| Standalone file ignored | Include all three of `name`, `version` and `schema`.                      |

## Notes

- Secrets use `${{ secrets.NAME }}`. Tessera needs none.
