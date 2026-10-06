# Repository governance

How this repository is protected, what the rules actually do, and how to change them.

## Rulesets

Two rulesets are active. They were created through the GitHub API (`gh api repos/:owner/:repo/rulesets`)
rather than the deprecated branch-protection API.

### `main` (id 24562552)

Target: the default branch.

| Rule                      | Effect                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deletion`                | `main` cannot be deleted.                                                                                                                                                             |
| `non_fast_forward`        | Force-pushing to `main` is refused.                                                                                                                                                   |
| `required_linear_history` | No merge commits; history stays linear.                                                                                                                                               |
| `pull_request`            | Changes reach `main` through a PR. Reviews are **not** required (count 0), so the owner can merge their own work. Dismissing stale reviews is off; **conversation resolution is on**. |
| `required_status_checks`  | `build` and `package` must pass, and the branch must be up to date with `main` before merging.                                                                                        |

**Why no required approvals.** This is a solo-maintained repository. Requiring even one approval
would mean the owner cannot merge anything, which is the self-lock the rules are supposed to avoid.
Review count is set to `0` deliberately; `required_review_thread_resolution` is enabled so a review
comment still has to be addressed.

**Up-to-date requirement.** `strict_required_status_checks_policy` is on, so a PR must be rebased on
`main` before merging. That is stricter but it means the commit CI proved green is the commit that
lands.

### `release-tags` (id 24562564)

Target: tags matching `refs/tags/v*`.

| Rule               | Effect                                           |
| ------------------ | ------------------------------------------------ |
| `deletion`         | A release tag cannot be deleted.                 |
| `update`           | A release tag cannot be moved to another commit. |
| `non_fast_forward` | A release tag cannot be rewritten.               |

There is deliberately **no `creation` rule**, so the release workflow can create `vX.Y.Z`. Adding
one would block the release path.

### Bypass

Both rulesets grant `RepositoryRole` id `5` (admin) `bypass_mode: "always"`.

Without this, a ruleset mistake locks the maintainer out of their own repository with no way to
recover but GitHub Support. The trade-off is that the rules are advisory for admins rather than
absolute — an admin _can_ force-push `main`. That is accepted: the rules exist to make accidental
damage hard, not to defend against the owner.

## Verifying the rulesets

```bash
# What rules apply to main, as GitHub evaluates them
gh api repos/radityama/tessera/rules/branches/main --jq '.[].type'

# Both rulesets and their enforcement state
gh api repos/radityama/tessera/rulesets \
  --jq '.[] | "\(.id)  \(.name)  target=\(.target)  \(.enforcement)"'
```

Expected on `main`:

```
deletion
non_fast_forward
required_linear_history
pull_request
required_status_checks
```

## Required status checks

The ruleset requires the contexts `build` and `package`, which are the job names in
`.github/workflows/ci.yml`.

**If a CI job is renamed, the ruleset must be updated in the same change**, or merges will block
waiting on a check that no longer exists. This is the most likely way to break the repository.

```bash
gh api -X PUT repos/radityama/tessera/rulesets/24562552 --input ruleset.json
```

## Changing a ruleset

1. Export the current definition: `gh api repos/radityama/tessera/rulesets/24562552 > ruleset.json`
2. Edit it.
3. Apply with `PUT`, then re-run the verification commands above.
4. Update this document in the same PR.

Do not paste a ruleset payload from a blog post or from memory — the schema has changed more than
once, and GitHub rejects unknown rule types rather than ignoring them.

## Other protections

| Mechanism    | Where                           | What it does                                                                                                          |
| ------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CODEOWNERS   | `.github/CODEOWNERS`            | Requests review from the owner on registry data, the schema, the release guard and the integration docs.              |
| Dependabot   | `.github/dependabot.yml`        | Weekly dependency and Actions updates.                                                                                |
| CI           | `.github/workflows/ci.yml`      | Lint, typecheck, build, tests, MCP conformance and the packaged-tarball smoke test.                                   |
| Release      | `.github/workflows/release.yml` | Re-runs the full gate on a tag, packs, smoke-tests, publishes when credentials exist, and creates the GitHub Release. |
| Release gate | `scripts/release-check.mjs`     | Governance files, version consistency, and the workspace and packaging checks, in one command.                        |

## History

Both rulesets were created on 2026-10-06, before the v0.1.0 tag, so the first release was tagged
under protection rather than before it.
