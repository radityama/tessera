# Security and Licensing

## Core principle

Indexing metadata is not the same as owning or having redistribution rights to source code.

Tessera must preserve that distinction.

## License metadata

License fields are factual metadata, not legal advice.

Rules:

- do not infer a license from repository visibility,
- do not mark a license permissive because source code is readable,
- preserve the upstream source of license information,
- expose `unknown` when uncertain,
- do not silently vendor unknown-license code.

## Source retrieval

If future versions fetch component source:

- use explicit upstream mechanisms where possible,
- record provenance,
- respect upstream terms,
- avoid bypassing access controls,
- do not cache code indefinitely without a deliberate policy.

## Installation safety

Tessera should prefer returning installation plans before executing mutations.

Any future automatic installer must:

- detect the target project,
- show files to be changed,
- detect conflicts,
- support dry-run,
- avoid destructive overwrites,
- surface shell commands before execution where possible.

## MCP safety

The MCP server should expose domain tools, not arbitrary command execution.

Do not add a generic `run_shell` tool.
