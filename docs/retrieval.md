# Artifact retrieval

Search tells an agent that a component exists. Retrieval gets it the actual implementation.
This is the difference between a catalogue and a usable tool.

```text
search → inspect → resolve artifact → agent adapts the files
```

## Two paths, deliberately separate

| Path                               | Network | Purpose                                        |
| ---------------------------------- | ------- | ---------------------------------------------- |
| Search / inspect                   | No      | Rank and explain components from the snapshot. |
| `fetch` / `get_component_artifact` | Yes     | Obtain a specific component's real source.     |

Keeping these apart means a slow or unavailable provider never degrades search, and search stays
deterministic and offline-testable.

## API

`@tessera/core` exposes one provider-neutral entry point:

```ts
resolveComponentArtifact(registry: TesseraComponent[], id: string, options?): Promise<ComponentArtifact>
```

It never accepts a URL — only a component id. The upstream URL comes from the registry
snapshot, so a caller cannot point Tessera at an arbitrary host.

```ts
interface ComponentArtifact {
  id: string;
  source: { provider: string; upstreamUrl: string };
  files: Array<{ path: string; content: string; type?: string }>;
  dependencies: string[];
  registryDependencies: string[];
  installCommand?: string;
  license: License;
  retrievedAt: string;
}
```

## Safety properties

Each of these is covered by a test in `packages/core/src/retrieval.test.ts`.

**No caller-supplied URLs.** The API takes an id. A URL-shaped id resolves to
`component-not-found`.

**Allowlist derived from advertised provenance.** The set of fetchable origins is built from the
hosts the registry _advertises_ in `links`. It is deliberately **not** derived from the
`retrieval` field being fetched — that would be circular, and one corrupt record could then
whitelist any host it liked. A component may only be fetched from a host it already claims.

**Redirects are validated per hop.** Redirects are followed manually with a bounded hop count,
and every destination must be on the allowlist. A redirect to an unlisted host is refused before
the request is made.

**Bounded requests.** A timeout and a response-size cap apply. The cap is enforced while
streaming the body, and a declared `content-length` over the cap is rejected before reading, so
a hostile response cannot exhaust memory.

**Validated payloads.** The response must match the registry-item contract — including files
that actually carry content. Anything else is `provider-contract-invalid`.

**Nothing is executed.** Retrieved code is returned as data. Tessera never runs it, never writes
it into a project unless asked, and never installs its dependencies.

**Structured errors.** Every failure produces a stable code. See `docs/mcp.md` for the table.

## Provider neutrality

`retrieval` is a discriminated union covering shadcn registries, raw source, GitHub source, npm
packages, documentation and metadata-only entries. v0.1 implements `shadcn-registry` and
`raw-source`.

The other kinds resolve to an explicit, explanatory error rather than a guess: an npm-distributed
component like HeroUI's tells the caller which package to install, and a GitHub-source component
reports that v0.1 does not fetch repository paths. Inventing a URL convention for a provider that
did not publish one is exactly the kind of assumption this project removed once already.

## Testing

Unit tests inject `fetchImpl`, so the suite runs offline and fails for reasons in this repository
rather than a third party's uptime. Live upstream checks are separate and manual:
`docs/testing.md`.
