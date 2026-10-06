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
| **Dogfood**       | Search, retrieve, adapt and _compile_ a real upstream component in a throwaway host project         | `scripts/dogfood.mjs`                                             |

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
pnpm dogfood     # full loop against live providers, then compile the result
pnpm registry:sync
```

`dogfood` searches for a component, inspects it, retrieves the real source, supplies the host
utility the component imports, and type-checks the result inside a minimal React project. It is
what proves the retrieved source is real code rather than text that merely resembles it, and it is
how the registry-dependency and under-declared-import limitations were found.

`registry:sync` fetches every provider's registry and rewrites the snapshots. Review the diff
before committing: a shrinking catalogue usually means a provider changed shape, and the diff is
where that becomes visible.

Both need the network, so neither runs in normal CI. A third party's uptime must not decide
whether this repository is green.

## Adding a test

Prefer a fixture over a network call, and prefer asserting behaviour over restating the
implementation. If a test would fail because an external service is unavailable, it belongs in the
live-smoke category instead.
