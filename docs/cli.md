# CLI

```bash
tessera search "<query>"        # rank components (local)
tessera inspect <id>            # full canonical metadata (local)
tessera similar <id>            # alternatives (local)
tessera add <id> --dry-run      # safe installation plan
tessera fetch <id>              # retrieve real upstream source
```

Only `fetch` touches the network. Search, `inspect` and `similar` read the pinned local
snapshot and work offline.

Every command accepts `--json` for scripting and `--registry <dir>` to point at a different
snapshot.

## Search

```bash
tessera search "dark technical terminal hero"
tessera search "minimal saas pricing cards" --category pricing --limit 5
tessera search "animated grid background" --source magicui --json
```

Each result explains itself: category, motion, dependency count, license, whether an artifact
is retrievable, and why it ranked where it did.

```
1. magicui/terminal — Terminal (0.612)
   category: terminal | source: magicui | frameworks: react
   motion: unknown | deps: 0 | license: MIT, OSI-approved, redistribution permitted
   artifact: retrievable (shadcn-registry)
   why: exact category match: terminal; matches aesthetics: terminal; no required runtime dependencies
```

## Inspect

```bash
tessera inspect aceternity/terminal
```

Shows the canonical record including retrieval mechanism, license with its evidence, and
provenance — including which fields Tessera inferred rather than read from upstream.

## Similar

```bash
tessera similar aceternity/terminal --limit 5
```

## Add

```bash
tessera add aceternity/terminal --dry-run
```

Prints what installing the component would involve. v0.1 never mutates the project;
`--no-dry-run` is refused with an explanatory error rather than doing something surprising.

## Fetch

Retrieves the component's real source from its upstream provider.

```bash
tessera fetch aceternity/terminal                  # print files and metadata
tessera fetch magicui/terminal --json              # full artifact as JSON
tessera fetch magicui/terminal --output ./vendor   # write files
tessera fetch magicui/terminal --output ./vendor --dry-run   # show what would be written
tessera fetch magicui/terminal --output ./vendor --force     # overwrite existing files
```

Behaviour and guarantees:

- **Nothing is installed or executed.** Files are written; dependencies are listed, not fetched.
- **Existing files are never overwritten silently.** A collision is reported and skipped; pass
  `--force` to overwrite deliberately.
- **Paths are treated as untrusted.** Upstream-declared paths that are absolute, contain `..`,
  or resolve outside `--output` are rejected with an `unsafe-artifact-path` error.
- **The upstream host must be one the registry advertises.** A component cannot be fetched from
  a host it does not claim as its own, and redirects that leave that host are refused.
- License status is printed on every fetch, with a warning when redistribution is restricted or
  the license is unknown.

Not every component is fetchable. HeroUI ships compiled through npm, and metadata-only entries
have no artifact; both produce a structured error explaining what to do instead. `search`
reports `artifact: retrievable (…)` or `not retrievable (…)` up front.

## Exit codes

| Code | Meaning            |
| ---- | ------------------ |
| `0`  | Success.           |
| `1`  | Any handled error. |

Errors print as JSON on stderr:

```json
{ "error": { "code": "artifact-unavailable", "message": "…" } }
```

Set `TESSERA_DEBUG=1` for internal detail. Stack traces are never shown by default.
