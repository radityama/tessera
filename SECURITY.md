# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/radityama/tessera/security/advisories/new)
on this repository. That channel is visible only to maintainers and lets us prepare a fix before
disclosure.

Include, where you can:

- what you did, what happened, and what you expected;
- the version (`tessera --version`) and platform;
- a minimal reproduction;
- your assessment of impact.

You can expect an acknowledgement within a few days. We will keep you updated and credit you in
the advisory unless you prefer otherwise.

## Supported versions

Tessera is pre-1.0. Security fixes are made on the latest minor release only.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | yes       |
| earlier | no        |

## What Tessera does

Tessera is a local tool. There is no hosted service and no telemetry. It reads metadata from a
snapshot bundled with the package and, when asked, fetches component source from a provider's
own registry.

By design it does **not**:

- execute retrieved component code;
- run shell or package-manager commands;
- install dependencies;
- write into a project unless explicitly told to, and never overwriting silently;
- expose a shell-execution tool over MCP;
- send data anywhere except the upstream provider for an explicitly requested fetch.

## Security-relevant surfaces

**Artifact retrieval.** `resolveComponentArtifact` accepts a component id, never a URL. Upstream
URLs come from the registry snapshot. The set of fetchable origins is derived from the hosts the
registry _advertises_ — deliberately not from the URL being fetched, which would let one corrupt
record whitelist any host. Redirects are followed manually, with a bounded hop count, and every
destination is validated against that allowlist before the request is made. Requests are bounded
by a timeout and a streaming response-size cap.

**File writes.** `tessera fetch --output` treats upstream-declared paths as untrusted. Absolute
paths, `..` segments, and anything resolving outside the output directory are rejected. Existing
files are skipped unless `--force` is given.

**Registry data.** Snapshots are generated, not hand-written, and a release guard fails the build
on placeholder domains, unevidenced licenses and missing retrieval. If you find fabricated or
misattributed registry data, that is a security-adjacent issue — report it.

**Dependency integrity.** Releases are published from CI with provenance when the registry
supports it. See [`RELEASING.md`](./RELEASING.md).

## Out of scope

- The content, quality, or licensing of third-party components that Tessera points at. Tessera
  indexes metadata; it does not author or host those components. Licence concerns belong upstream,
  though we want to hear about them because misattributed metadata is our bug.
- Vulnerabilities in the coding agents or MCP clients that use Tessera.
- Anything requiring an attacker to already control the user's machine or the registry snapshot
  they installed.
