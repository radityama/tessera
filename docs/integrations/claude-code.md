# Claude Code

|                   |                                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| **Status**        | runtime-verified                                                                 |
| **Transport**     | stdio                                                                            |
| **Last verified** | 2026-10-06                                                                       |
| **Official docs** | <https://code.claude.com/docs/en/mcp> · <https://code.claude.com/docs/en/skills> |

## Prerequisites

- Claude Code installed (`claude --version`)
- Node.js 20 or later

## Installation

Nothing to install ahead of time — `npx` fetches Tessera on first launch.

Optionally install it globally so the first launch is faster:

```bash
npm install -g @tessera-dev/cli
```

## Project-scoped configuration

Create `.mcp.json` in the project root:

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

Commit that file to share Tessera with everyone working in the repository. Claude Code asks for
approval the first time it loads a project-scoped server.

## Global configuration

```bash
claude mcp add --scope user tessera -- npx -y @tessera-dev/cli mcp
```

Scope flags: `--scope local` (default, private to you in this project), `--scope project`
(writes `.mcp.json`), `--scope user` (available in all your projects).

Everything after `--` is the server command.

## How to verify the server

```bash
claude mcp list      # expect: tessera ... ✔ Connected
claude mcp get tessera
```

Inside a session, `/mcp` lists connected servers and their tool counts.

## Example prompt

> Build a developer-tool landing page. Before implementing any visually significant section,
> use Tessera to search for reusable components. Keep the result dark, technical, understated
> and visually coherent.

Tessera's six tools (`search_components`, `get_component`, `get_component_artifact`,
`get_installation`, `find_similar_components`, `search_patterns`) then appear in the session.

## Skill

Claude Code supports Agent Skills. Install Tessera's skill either per-project or per-user:

```bash
# project
mkdir -p .claude/skills/tessera && cp skills/tessera/SKILL.md .claude/skills/tessera/

# user
mkdir -p ~/.claude/skills/tessera && cp skills/tessera/SKILL.md ~/.claude/skills/tessera/
```

Claude Code also reads `.claude/skills/` nested in subdirectories, scoped to files under that
directory.

## Troubleshooting

| Symptom                                  | Cause and fix                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `✘ Failed to connect`                    | Run `npx -y @tessera-dev/cli doctor` directly. If that passes, the harness cannot see `npx` on its `PATH`; use an absolute path to `npx` in `args`. |
| `⏸ Pending approval`                     | Project-scoped servers need approval. Approve it, or use `--scope user`.                                                                            |
| Server starts but the agent ignores it   | The agent has to be asked to use Tessera. Install the skill, or add the project-rule snippet from `generic-mcp.md`.                                 |
| Tools listed but searches return nothing | `tessera doctor` — most likely the bundled registry was not found.                                                                                  |

## Notes

- Windows-specific stdio caveats are **UNVERIFIED** — the official MCP page documents none, and
  this was not tested on Windows.
