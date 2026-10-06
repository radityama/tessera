# Support

## Start here

- **Installation and setup** — [`docs/installation.md`](./docs/installation.md)
- **Connect a coding agent** — [`docs/integrations/`](./docs/integrations/README.md)
- **Commands** — [`docs/cli.md`](./docs/cli.md)
- **MCP tools** — [`docs/mcp.md`](./docs/mcp.md)
- **Something is broken** — `tessera doctor`

```bash
tessera doctor
```

`doctor` checks the Node version, which registry is in use, that every component validates, that
licenses carry evidence, and that the MCP server starts. It is the first thing to run, and most
problems are answered by its output.

## Getting help

- **Questions and ideas** — open a
  [discussion or issue](https://github.com/radityama/tessera/issues).
- **Bugs** — use the bug report form. Include your OS, `node --version`, `tessera --version`, and
  the full output of `tessera doctor`.
- **Feature requests** — use the feature request form.
- **A library should be supported** — use the registry source form. See
  [`docs/sources.md`](./docs/sources.md) for what a source needs to qualify.
- **Security** — follow [`SECURITY.md`](./SECURITY.md). Do not open a public issue.

## Common problems

| Symptom                                         | Fix                                                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no registry found`                             | Run `tessera doctor`. Pass `--registry <dir>` or set `TESSERA_REGISTRIES` if you are using a custom snapshot.                                                                       |
| Search returns nothing                          | `tessera search "<query>" --limit 20`; check `tessera doctor` reports a non-zero component count.                                                                                   |
| `artifact-unavailable` on `fetch`               | The component is not fetchable. HeroUI ships through npm; run `tessera inspect <id>` to see the retrieval mechanism.                                                                |
| `blocked-origin`                                | The component's upstream host is not one the registry advertises. Please report it — it usually means a snapshot is wrong.                                                          |
| MCP server connects but the agent never uses it | Install the skill, or add the project-rule snippet in [`docs/integrations/generic-mcp.md`](./docs/integrations/generic-mcp.md). Agents do not use tools they were not asked to use. |
| `npx: command not found` in an editor           | GUI apps often get a minimal `PATH`. Use an absolute path to `npx` in the MCP config.                                                                                               |

## Scope of support

Tessera is maintained on a best-effort basis. Supported: the latest 0.1.x release, on Node.js 20
and later. Third-party component libraries are supported only as sources — questions about their
components belong with those projects.
