# MCP Server

The MCP server is a thin protocol layer over the Tessera retrieval core.

It must not contain ranking logic.

## Tool: `search_components`

Purpose: search and rank components.

Input concept:

```json
{
  "query": "dark technical terminal hero",
  "category": "hero",
  "framework": "react",
  "limit": 10
}
```

Output should include:

- ID,
- name,
- source,
- category,
- visual tags,
- dependencies summary,
- license status,
- score,
- score reasons.

## Tool: `get_component`

Returns complete canonical metadata for one component ID.

It may include source or preview URLs, but must not imply that remote source code has been vendored locally.

## Tool: `get_installation`

Returns safe installation guidance.

Possible output:

- package command,
- upstream CLI command,
- copy instructions,
- required dependencies,
- caveats.

Do not execute installation automatically through this tool.

## Tool: `find_similar_components`

Given a component ID, return alternatives based on:

- category,
- visual aesthetics,
- motion level,
- framework,
- dependency profile.

## Tool: `search_patterns`

Search higher-level UI patterns rather than exact component names.

Example:

```text
"developer tool hero with terminal and subtle grid"
```

## Error behavior

Errors should be structured and actionable.

Examples:

- unknown component ID,
- unsupported framework filter,
- malformed query,
- empty registry,
- invalid registry snapshot.

Never return an unhandled stack trace as a tool result.
