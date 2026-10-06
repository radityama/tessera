# Distribution

## The problem this solves

The CLI and MCP server originally resolved the registry by walking up from the current
directory looking for `registries/`. That works inside a clone of this repository and nowhere
else, so an installed Tessera could not search anything. Fixing it required deciding where
registry data lives for an installed package.

## Layout

```text
packages/
  registry/          @tessera-dev/registry   schemas + bundled registry snapshot
  core/              @tessera-dev/core       search, ranking, artifact retrieval
  mcp/               @tessera-dev/mcp        MCP server
  cli/               @tessera-dev/cli        the `tessera` executable  ← end-user entrypoint
  adapters/          (private)               registry sync tooling, never published
```

`@tessera-dev/cli` is the distribution package. It owns the `tessera` binary, including
`tessera mcp`, so there is exactly one published executable and one install command.

A separate thin `tessera` meta-package was considered and rejected: two packages declaring the
same `tessera` bin would collide when installed together, and a meta-package that only
re-exports adds a version to keep in sync without removing any work.

## Bundled registry

`packages/registry/scripts/bundle-registry.mjs` copies the repository's pinned snapshots into
`packages/registry/bundled-registry/` during that package's build, and refuses to produce an
empty bundle. `bundled-registry/` is generated, git-ignored, and listed in the package's
`files`, so it ships inside the tarball.

`loadBundledRegistry()` resolves it relative to the compiled module, and the path is identical
before and after installation because `src/` and `dist/` are both one level below the package
root.

## Registry resolution precedence

Implemented once, in `@tessera-dev/registry`, so the CLI and MCP cannot disagree:

1. `--registry <dir>` (explicit)
2. `TESSERA_REGISTRIES` (environment)
3. a `registries/` directory found walking up from the current directory — the contributor case
4. the bundled snapshot — the installed case

`tessera doctor` reports which one is active.

## Package names

The npm scope `@tessera` is owned by an unrelated account, and the bare name `tessera` is
taken, so neither is available. Packages publish under the **`@tessera-dev`** scope, which was
verified available, and the product keeps its name: the binary is still `tessera`.

The `publishConfig.access: "public"` field is set on every publishable package, which scoped
packages require.

## Verifying a package

```bash
pnpm build
pnpm smoke:pack
```

`scripts/smoke-pack.mjs` packs the publishable packages, installs the tarballs into a throwaway
project **outside this repository**, and then:

- checks the consumer has no `registries/` directory, so the bundled snapshot is genuinely what
  is being used;
- runs `tessera --help`, `search`, `inspect`, `doctor`;
- confirms a fetch of an npm-distributed component returns a structured error, without network;
- starts `tessera mcp` and performs a real MCP `initialize` handshake and `tools/list` over
  stdio, asserting all six tools are exposed.

This runs in CI on every pull request as the `package` job.

## Publishing

See [`RELEASING.md`](../RELEASING.md). Release automation packs and smoke-tests the tarballs
before anything is published, and does not publish at all if authentication is unavailable.
