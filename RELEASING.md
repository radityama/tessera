# Releasing

Tessera releases are cut from `main` by tagging a commit that has passed every gate. Nothing is
published by hand from a laptop.

## Versioning

Semantic Versioning. Pre-1.0, a minor bump may include breaking changes; those must be called out
in the changelog and the release notes.

All publishable packages share one version. It is defined in each `package.json`; keep them in
sync. `pnpm release:check` fails if they drift.

## Preconditions

A release can only be cut when:

- `main` is green, including the `package` CI job;
- `CHANGELOG.md` has an entry for the version, with no `Unreleased` items pending;
- registry data is current (`pnpm registry:sync` run and reviewed since the last source change);
- the integration compatibility matrix reflects reality.

## Procedure

### 1. Release branch

```bash
git checkout main && git pull
git checkout -b release/vX.Y.Z
```

### 2. Synchronise versions

Bump `version` in every publishable `package.json`
(`packages/{registry,core,mcp,cli}`) and in `packages/core/src/index.ts`, `packages/mcp/src/index.ts`
and the CLI's `program.version(...)` if they carry a literal.

Then confirm:

```bash
pnpm release:check
```

### 3. Finalise the changelog

Move everything under `## [Unreleased]` into `## [X.Y.Z] - YYYY-MM-DD`, and add the comparison
links at the bottom. Do not claim anything that did not ship.

### 4. Update user-facing status

- README status line — it should say which version is available, not "scaffold".
- `docs/roadmap.md` — move what shipped into the released section.
- `docs/integrations/compatibility.md` — correct any status that changed.

### 5. Run the full gate

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

`release:check` runs lint, typecheck, tests, build, registry validation, the placeholder-URL and
licence-evidence guards, package packing, the consumer smoke test and the MCP conformance suite.

### 6. Open the release PR

Title: `release: Tessera vX.Y.Z`. Body: the release notes draft, so reviewers see exactly what
will be published. Wait for CI.

### 7. Merge, then tag

```bash
git checkout main && git pull
git tag -a vX.Y.Z -m "Tessera vX.Y.Z"
git push origin vX.Y.Z
```

The tag **must** point at the tested commit — the one CI proved green. Never tag a commit that
has not passed the gate, and never create `vX.Y.Z-final` or similar; if a release is wrong, cut a
new patch version.

### 8. Release workflow

Pushing the tag triggers `.github/workflows/release.yml`, which re-runs the full gate, packs the
publishable packages, smoke-tests the tarballs, publishes to npm, and creates the GitHub Release.

If npm authentication is not configured, the workflow **stops before publishing** and reports
what is missing. It must never report success without having published.

### 9. Verify the release

From a clean directory outside the repository, install from the public registry — not from the
workspace:

```bash
cd "$(mktemp -d)"
npx -y @tessera-dev/cli --version     # expect X.Y.Z
npx -y @tessera-dev/cli doctor
npx -y @tessera-dev/cli search "dark technical terminal hero"
npx -y @tessera-dev/cli fetch magicui/terminal --dry-run
```

Confirm the registry ships with the package (`doctor` reports `registry-source: bundled`) and that
`npx -y @tessera-dev/cli mcp` starts.

## Publishing credentials

npm credentials are **never** committed. Configure npm [trusted publishing](https://docs.npmjs.com/trusted-publishers)
for the repository, or set an `NPM_TOKEN` repository secret. Trusted publishing is preferred
because it issues short-lived credentials per run and attaches provenance.

Scoped packages require `publishConfig.access: "public"`, which every publishable package sets.

## v0.1.0 bootstrap vs future releases

v0.1.0 reached npm through a **manual bootstrap publish**: the tag workflow built and
smoke-tested the tarballs but published nothing (no credentials were configured at the time),
so the four packages were published by hand afterwards. That is a one-off, not the procedure.

From v0.1.1 on, releases should publish through the tag workflow in
`.github/workflows/release.yml`, which requires either Trusted Publishing or an `NPM_TOKEN`
secret. Neither is claimed to be configured here — check the repository settings before
assuming a tag push will publish.

## If something goes wrong

- **Publishing failed part-way.** Some packages may be published and others not. Fix forward: cut
  a patch release rather than trying to unpublish. npm does not allow republishing a version.
- **The release is bad.** Cut `X.Y.Z+1` immediately and mark the bad release in the GitHub Release
  notes.
- **The tag is wrong.** Delete the tag locally and remotely, fix, and re-tag the correct tested
  commit. Tag protection permits maintainers to do this deliberately; it is not a routine action.
