# Search and Ranking

v0.1 ranking must be deterministic and understandable.

Do not use an LLM inside the ranking loop.

## Query pipeline

1. normalize whitespace and casing,
2. identify explicit category terms,
3. identify framework terms,
4. identify style/aesthetic terms,
5. identify motion preference,
6. identify product-context terms such as `developer tool`, `saas`, `commerce`, `dashboard`,
7. produce structured query intent,
8. filter impossible candidates,
9. score remaining candidates,
10. sort by score then stable ID.

## Initial score

Use this baseline:

| Dimension                | Weight |
| ------------------------ | -----: |
| Query / visual relevance |    35% |
| Stack compatibility      |    20% |
| Dependency cost          |    15% |
| Adaptability             |    15% |
| Accessibility metadata   |    10% |
| License confidence       |     5% |

The exact implementation can subdivide these dimensions, but changes must be documented and tested.

Implemented tie-breakers (kept outside the capped relevance dimension so richer matches are not hidden by the 1.0 cap):

- +0.05 when a query-mentioned category matches a secondary category (e.g. `terminal` matching `terminal-hero`'s secondary category),
- +0.05 when the component motion level exactly matches the requested motion.

Both are deterministic and covered by golden-query tests.

## Relevance

Potential inputs:

- name token matches,
- description matches,
- category match,
- aesthetic tag match,
- pattern tag match,
- product-context tag match.

## Stack compatibility

Prefer exact framework compatibility.

Examples:

- React request + React component → strong positive.
- Next.js request + React component known to work in Next.js → positive.
- React request + Vue-only component → reject or near-zero.

## Dependency cost

Prefer fewer and lighter required dependencies when visual relevance is otherwise similar.

Do not automatically punish a required motion library if the user explicitly requested complex animation.

## Adaptability

A component is easier to adapt when:

- its layout is reusable,
- its identity is not deeply baked into assets,
- its styling is tokenizable,
- its copy is not structurally fixed,
- it does not rely on opaque runtime services.

## License confidence

Known permissive status may receive a small positive score.

Unknown status should never be treated as permissive.

## Score explanation

Every result should expose something like:

```json
{
  "score": 0.91,
  "reasons": [
    "exact category match: hero",
    "matches aesthetics: technical, dark",
    "React and Next.js compatible",
    "motion level matches requested subtle motion",
    "one required runtime dependency"
  ]
}
```

The goal is useful explanation, not mathematical theater.
