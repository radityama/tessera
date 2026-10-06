# Example: agent MCP session

An agent connected to the Tessera MCP server follows the same retrieval path as the CLI:

1. `search_components` with `{ "query": "technical dark hero for a developer CLI, subtle motion, terminal-oriented", "limit": 5 }`
2. `get_component` with `{ "id": "beautifului/terminal-hero" }` to read canonical metadata.
3. `get_installation` with `{ "id": "beautifului/terminal-hero" }` for safe install guidance.
4. `find_similar_components` with `{ "id": "beautifului/terminal-hero", "limit": 3 }` for alternatives.
5. `search_patterns` with `{ "query": "developer tool hero with terminal and subtle grid" }` for pattern-level discovery.

Contract: MCP results represent the same canonical records and ranking as `tessera search --json`. Errors are structured (`{ "error": { "code", "message" } }`); tools never execute shell commands or install dependencies.
