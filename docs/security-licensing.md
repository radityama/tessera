# Security and licensing

## Core principle

Indexing metadata is not the same as owning or having redistribution rights to source code.
Tessera keeps that distinction structural rather than advisory.

## What Tessera does and does not do

**Does**

- store metadata and provenance only — no component source in the repository;
- fetch source on request through a provider-neutral API with an allowlist derived from
  registry data;
- report license facts with an evidence URL, or `unknown`;
- refuse to claim a license it cannot evidence.

**Does not**

- execute retrieved component code;
- write into a user's project without an explicit request and conflict handling;
- run package manager commands;
- install dependencies;
- mirror, cache or redistribute provider source;
- bypass authentication or access controls;
- expose a generic shell-execution tool over MCP.

## License metadata

License fields are factual metadata, not legal advice.

Rules, enforced by schema validation and tests:

- do not infer a license from repository visibility;
- do not mark a license permissive because source code is readable;
- `status: "known"` requires an identifier **and** an evidence URL;
- `status: "unknown"` must not carry an identifier;
- expose `unknown` when uncertain;
- never vendor unknown-license code.

Non-SPDX licenses use the SPDX `LicenseRef-` convention. Aceternity's license is recorded as
`LicenseRef-Aceternity`: known, not OSI-approved, and `redistribution: "restricted"`.

### Known versus reusable

A _known_ license is not necessarily a _permissive_ one. `status` records what the license is;
`redistribution` records whether the source may be copied into another project. Consumers must
check both. `packages/registry/src/release-guard.test.ts` fails the build if a component claims
`redistribution: "permitted"` while its license status is `unknown`.

## Retrieval safety

`resolveComponentArtifact` in `@tessera/core`:

- derives the upstream URL from registry metadata — never from caller-supplied input;
- rejects any URL whose origin is not in the allowlist built from the registry snapshot;
- enforces an HTTP timeout and caps the response body size;
- validates the returned payload against the artifact schema before returning it;
- preserves provenance (provider and exact upstream URL) on the artifact;
- returns structured error codes rather than throwing raw errors.

## Installation safety

`tessera add` is dry-run by default and v0.1 never mutates a project. `tessera fetch` writes
files only when `--output` is given, and refuses to overwrite an existing file unless
`--force` is passed.

Any future automatic installer must: detect the target project, show the files it will change,
detect conflicts, support dry-run, avoid destructive overwrites, and surface shell commands
before running them.

## MCP safety

The MCP server exposes domain tools only. It never executes shell commands, writes project
files, installs dependencies, or runs retrieved code. `get_component_artifact` returns source
for the host agent to adapt; adapting is the host agent's decision and its user's responsibility.

## Reporting a vulnerability

See [`../SECURITY.md`](../SECURITY.md).
