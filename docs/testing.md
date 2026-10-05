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

## Phase 0 test infrastructure

Vitest runs in Node.js. The root suite tests lint enforcement of allowed dependencies, rejected private paths and relative escapes, dynamic imports, and contract-test exceptions.

Unimplemented workspaces explicitly permit no test files during foundation work. This is not evidence of product behavior. Remove that allowance from each workspace as its implementation gains meaningful tests, starting with the registry in Phase 1. Root tests do not use the allowance.

Use `pnpm test` for the root suite and workspace suites. Package tests resolve the shared configuration with their own working directory as the root. CI runs all checks from a fresh checkout, and dependent typechecking and tests wait for the dependency build artifacts they consume.
