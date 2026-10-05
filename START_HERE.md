# Start Here

This repository is designed to be handed directly to a coding agent.

## Instruction to the implementing agent

Read these files before writing code:

1. `AGENTS.md`
2. `docs/product-spec.md`
3. `docs/architecture.md`
4. `docs/component-model.md`
5. `docs/search-ranking.md`
6. `docs/registry-ingestion.md`
7. `docs/mcp.md`
8. `docs/cli.md`
9. `docs/testing.md`
10. `docs/security-licensing.md`
11. `docs/roadmap.md`
12. `skills/tessera/SKILL.md`

Then execute `TASKS.md` in order.

Do not jump directly into the web app. The first milestone is a working local retrieval pipeline with tests.

## Definition of first success

Given a query such as:

```text
technical dark hero for a developer CLI, subtle motion, terminal-oriented
```

Tessera should return ranked component candidates from the curated registries with:

- component name,
- source library,
- category,
- visual tags,
- framework compatibility,
- dependency cost,
- motion intensity,
- installation instructions,
- license metadata,
- relevance score,
- score explanation.

The same retrieval capability must be available through both the CLI and MCP server.
