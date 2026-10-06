# Any MCP client

Tessera is a standard local **stdio** MCP server. It has no remote endpoint, no authentication and
no required environment variables, so any client that can launch a subprocess and speak MCP over
stdin/stdout can use it.

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| **Status**        | verified via the protocol conformance suite (see below) |
| **Transport**     | stdio only                                              |
| **Command**       | `npx -y @tessera-dev/cli mcp`                           |
| **Last verified** | 2026-10-06                                              |

## Configuration

Point your client's stdio server configuration at:

```json
{
  "command": "npx",
  "args": ["-y", "@tessera-dev/cli", "mcp"]
}
```

Key names differ per client — see the per-harness pages. The command and args are always the same.

## What the server exposes

Capabilities: **tools only**. No resources, no prompts, no sampling, no logging.

| Tool                      | Purpose                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `search_components`       | Rank components for a natural-language query, with score explanations. |
| `get_component`           | Full canonical metadata for one id.                                    |
| `get_component_artifact`  | Fetch the real upstream source files, dependencies and license.        |
| `get_installation`        | A safe installation plan. Never executes anything.                     |
| `find_similar_components` | Alternatives by category, aesthetics, motion and stack.                |
| `search_patterns`         | Higher-level UI patterns rather than exact names.                      |

If your client lists the server but shows no tools, the server failed to start. Run
`npx -y @tessera-dev/cli doctor` to see why.

## Protocol conformance

The server is tested against the protocol directly, which is more meaningful than a screenshot from
any one client:

```bash
pnpm build
node scripts/mcp-conformance.mjs
```

This drives a real stdio session and verifies the `initialize` handshake, protocol version
negotiation, tool capability advertisement, exact tool set, every tool's behaviour, structured
error responses, absence of stack traces, and a clean shutdown.

## Project rules instead of a skill

Harnesses that support Agent Skills can install `skills/tessera/SKILL.md` directly. For those that
do not, the same guidance works as a project rule. Drop this into `AGENTS.md`, `.cursorrules`,
`.clinerules`, or whatever rule file your harness reads:

```markdown
## Reuse existing UI before generating it

For any visually significant section — hero, navbar, pricing, testimonial, footer, dashboard,
command menu, terminal panel, background — search Tessera before writing it from scratch.

1. Decompose the page into sections and decide the design language first: typography, radius,
   border treatment, surface style, motion level, density.
2. Call `search_components` with a description of the section and the desired aesthetic.
3. Read the `reasons` on the top results. Do not take rank #1 on faith.
4. Call `get_component` to check the license and dependencies, and `get_component_artifact` to
   retrieve the source.
5. Adapt the retrieved source to this project's design tokens. Never ship a library's demo
   branding, copy or colour system.
6. After assembling the page, do a cohesion pass. Reject a component that clashes with the
   established design language even if it ranked well, and call `find_similar_components`
   for an alternative.

Prefer writing product-specific UI from scratch. Reuse is for the visually generic parts.
```

## Verifying your client

```bash
npx -y @tessera-dev/cli doctor          # registry, schema, license evidence, MCP startup
npx -y @tessera-dev/cli mcp             # the server your client launches
```

## Troubleshooting

| Symptom                        | Cause and fix                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Server exits immediately       | Run the command directly and read the JSON error on stderr.                                                               |
| `command not found`            | GUI applications often have a minimal `PATH`. Use an absolute path to `npx`.                                              |
| Server connects, tools missing | `tessera doctor` — the registry may not have loaded.                                                                      |
| No output at all               | The server writes protocol frames to stdout and diagnostics to stderr. If your client merges them, it will fail to parse. |
