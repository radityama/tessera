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

## Tool: `get_component_artifact`

Retrieves the actual implementation from the component's upstream provider, and returns:

- the real source files, with their upstream paths,
- npm dependencies and registry dependencies,
- the install command, when the provider publishes one,
- the license, including whether redistribution is permitted,
- provenance: the provider and the exact upstream URL.

Intended flow:

```text
search_components → get_component → get_component_artifact → agent adapts the files
```

Constraints — this tool **never**:

- executes retrieved code,
- writes files into a project,
- installs dependencies,
- runs package manager or shell commands.

Those remain the host agent's decisions. The files are returned as data and nothing else.

The upstream URL always comes from the registry snapshot, never from the caller, and every
redirect hop is validated against an allowlist of hosts the registry already advertises. Requests
are bounded by a timeout and a response-size cap, and the payload is validated before it is
returned.

### When an artifact is unavailable

Not every component can be fetched. `retrievalKind` and `retrievable` are included in
`search_components` output so an agent can tell before trying:

| `retrievalKind`   | Meaning                                                             |
| ----------------- | ------------------------------------------------------------------- |
| `shadcn-registry` | Fetchable. Source is inlined in the provider's registry item.       |
| `raw-source`      | Fetchable from a single upstream URL.                               |
| `npm-package`     | Not fetchable. Ships compiled through npm; use the install command. |
| `documentation`   | Not fetchable. Documented upstream, no published source payload.    |
| `none`            | Metadata only. No artifact exists.                                  |

Unavailable artifacts produce a structured error rather than a stack trace — see below.

## Error behavior

Errors should be structured and actionable. Every tool error has the shape:

```json
{ "error": { "code": "artifact-unavailable", "message": "…", "detail": { "…": "…" } } }
```

Codes currently emitted:

| Code                             | Meaning                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `component-not-found`            | No component with that id.                                          |
| `artifact-unavailable`           | The component exists but publishes no fetchable source.             |
| `retrieval-not-supported`        | Fetchable in principle, not implemented in v0.1 (GitHub source).    |
| `blocked-origin`                 | Retrieval target or a redirect left the advertising-host allowlist. |
| `provider-unreachable`           | Timeout, DNS failure or a 5xx from upstream.                        |
| `provider-contract-invalid`      | Upstream answered, but not with the expected payload.               |
| `response-too-large`             | Response exceeded the size cap.                                     |
| `unsupported-framework`          | Framework filter outside the supported set.                         |
| `invalid-limit`, `invalid-query` | Bad arguments.                                                      |
| `internal-error`                 | Anything unanticipated.                                             |

Never return an unhandled stack trace as a tool result.
