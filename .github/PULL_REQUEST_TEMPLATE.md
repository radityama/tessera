## Summary

<!-- What changes, in a sentence or two. -->

## Why

<!-- The problem this solves. If it fixes an issue, link it. -->

## Testing

<!-- What you ran, and what you observed. Paste relevant output. -->
<!-- "pnpm test passes" is weaker than naming the behaviour it now pins. -->

```
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Registry and licensing impact

<!--
Does this touch registries/, a source descriptor, or anything licence-related?
If not, say "none". If it does, state which source, what changed, and how the
licence was verified — an evidence URL is required for any `status: "known"`.
-->

none

## Breaking changes

<!--
Schema changes, renamed packages or commands, removed ids. If v1 records are no
longer accepted, say so here and note the migration path.
-->

none

## Checklist

- [ ] Focused on one change; unrelated refactors are not mixed in.
- [ ] Tests pass offline — no test depends on a third party's uptime.
- [ ] New metadata is verified, or recorded as `unknown`. Nothing invented.
- [ ] Docs updated if behaviour changed.
- [ ] `CHANGELOG.md` updated if this is user-facing.
