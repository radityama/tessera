# Testing Strategy

## Unit tests

Cover:

- schema validation,
- stable ID validation,
- query normalization,
- filters,
- score calculation,
- deterministic sorting,
- adapter mappings.

## Fixture-based adapter tests

Never require live third-party websites in CI.

Store representative source fixtures and test normalization against them.

## Golden retrieval tests

Keep representative queries such as:

```text
"dark technical terminal hero"
"minimal saas pricing cards"
"animated grid background subtle"
"developer command menu"
```

Verify that expected categories and high-quality candidates remain near the top.

Avoid overspecifying exact full order when it makes tests unnecessarily brittle; test important ranking invariants.

## Cross-interface contract tests

The same query through:

- core API,
- CLI JSON mode,
- MCP tool

should represent the same canonical results.

## Validation tests

Explicitly test:

- duplicate IDs,
- malformed source metadata,
- unknown license,
- missing installation info,
- unsupported framework,
- empty registry,
- invalid schema version.
