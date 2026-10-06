# Testing

```bash
pnpm lint
pnpm typecheck
pnpm build          # required before test: the registry bundle is built here
pnpm test
pnpm smoke:pack     # packs, installs into a throwaway project, drives CLI + MCP
pnpm mcp:conformance
pnpm registry:sync  # network; only needed when refreshing snapshots
```

## Test categories

| Category          | What it covers                                                                                      | Where                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Unit**          | Schema validation, ids, query inference, ranking, classification, artifact parsing                  | `packages/*/src/*.test.ts`                                        |
| **Contract**      | CLI/core parity and MCP/core parity — the same query yields the same ordering through every surface | `packages/cli/src/cli.test.ts`, `packages/mcp/src/server.test.ts` |
| **Snapshot**      | Golden query ordering, pinned so a ranking regression shows as a reviewable diff                    | `packages/core/src/snapshot.test.ts`                              |
| **Release guard** | Published registry data: no placeholder domains, no unevidenced licenses, no missing retrieval      | `packages/registry/src/release-guard.test.ts`                     |
| **Packaging**     | Tarball install into a clean project outside the repo                                               | `scripts/smoke-pack.mjs`                                          |
| **Integration**   | MCP stdio lifecycle: handshake, tool discovery, every tool, errors, shutdown                        | `scripts/mcp-conformance.mjs`                                     |
| **Live smoke**    | Real upstream endpoints, run manually                                                               | `pnpm registry:sync`                                              |

## No test depends on a third party's uptime

This is a deliberate constraint. A suite that fails because someone else's site is down teaches
contributors to ignore red CI.

- Adapter and retrieval tests inject `fetchImpl` and run against fixtures.
- Registry tests read the pinned local snapshot.
- The golden-query snapshots are computed from that same snapshot.

The only network-dependent commands are `pnpm registry:sync` and — at runtime, by design —
`tessera fetch`.

## Testing retrieval

`packages/core/src/retrieval.test.ts` injects a fake fetch and covers: allowlist enforcement,
redirects that leave the allowlist, bounded redirect loops, timeouts, auth-gated and missing
artifacts, oversized responses (both declared and streamed), malformed payloads, provenance
preservation, and that a URL-shaped id never resolves.

## Testing against real upstreams

```bash
pnpm registry:sync
```

Fetches every provider's registry, rewrites the snapshots, and reports what it skipped. Review the
diff before committing: a shrinking catalogue usually means a provider changed shape, and the diff
is where that becomes visible.

## Adding a test

Prefer a fixture over a network call, and prefer asserting behaviour over restating the
implementation. If a test would fail because an external service is unavailable, it belongs in the
live-smoke category instead.
