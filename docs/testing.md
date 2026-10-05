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

Unimplemented workspaces explicitly permit no test files during foundation work. This is not evidence of product behavior. The registry removed that allowance in Phase 1 and now tests its complete schema, dependency-knowledge defaults, loader errors, duplicate detection, merging, and curated snapshot invariants. Remove the allowance from other workspaces as they gain meaningful tests. Root tests do not use the allowance.

Registry tests create temporary local JSON files and perform no HTTP requests. Its typecheck includes tests; its separate build configuration emits only runtime code, declarations, source maps, and bundled JSON. Verify the compiled public package in plain Node from a temporary installed-package layout to catch missing data or repository-relative runtime paths.

Use `pnpm test` for the root suite and workspace suites. Package tests resolve the shared configuration with their own working directory as the root. CI runs all checks from a fresh checkout, and dependent typechecking and tests wait for the dependency build artifacts they consume.
