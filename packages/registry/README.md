# @tessera/registry

Canonical component schemas, versioned local snapshot validation, and bundled curated metadata. This package owns validation and persistence; it performs no HTTP retrieval or installation.

```ts
import {
  loadDefaultRegistry,
  loadRegistry,
  mergeRegistries,
  parseRegistry,
  createComponentId,
  RegistryError,
} from "@tessera/registry";

const curated = loadDefaultRegistry();
const local = await loadRegistry("./components.json");
const combined = mergeRegistries([curated, local]);
const empty = parseRegistry({ schemaVersion: 1, components: [] });
const id = createComponentId("aceternity", "terminal");
```

`componentSchema` and `registrySchema` are strict Zod 4 schemas. Public `TesseraComponent`, `RegistrySnapshot`, `ComponentCategory`, `Framework`, and `MotionLevel` types are inferred from them. Enum constants are exported as `COMPONENT_CATEGORIES`, `FRAMEWORKS`, `MOTION_LEVELS`, `DENSITIES`, `RADII`, `SURFACES`, `DEPENDENCY_KINDS`, `DEPENDENCY_STATUSES`, and `INSTALLATION_KINDS`; `SCHEMA_VERSION` is 1. See the [complete model](../../docs/component-model.md).

Both snapshot and record versions must be 1. Unknown/provider-specific keys, invalid enums, mismatched IDs, non-HTTP(S) metadata URLs, duplicate IDs, and incomplete known-license evidence are rejected. Empty snapshots are valid. `parseRegistry` and `loadRegistry` preserve record order; merged and default snapshots sort IDs with ASCII comparison. Merging validates each input before validating cross-snapshot duplicates and returns independent data.

`loadRegistry(path: string | URL)` accepts a local path or a `file:` URL, reads UTF-8 JSON, and validates it. `RegistryError` exposes `code`, an actionable `message`, and JSON-serializable `issues: Array<{ path: Array<string | number>; message: string }>`. JSON serialization of the error includes these fields. Error codes are stable:

| Code               | Meaning                                             | Next step                              |
| ------------------ | --------------------------------------------------- | -------------------------------------- |
| `REGISTRY_IO`      | File missing, unreadable, or invalid local path/URL | Check path, access, and `file:` scheme |
| `REGISTRY_JSON`    | Malformed JSON                                      | Correct JSON syntax                    |
| `REGISTRY_INVALID` | Canonical schema or identity violation              | Correct the fields listed in `issues`  |

Duplicate issues identify `components[index].id` and the first occurrence. Invalid merge inputs prepend `snapshots[index]` to issue paths. Public messages do not include Zod stack traces.

The committed snapshot lives in `src/data/registry.json` and has 20 reviewed records, four per source. Each default load validates it again and returns independent data. Node ESM JSON import attributes load the bundled file; `tsc` copies it into `dist/data/registry.json`. Public exports resolve to `dist/index.js` and `dist/index.d.ts`, so runtime loading works outside the repository. The build excludes tests while typechecking includes them.

Metadata was manually reviewed from bounded official catalog/docs pages on 2026-10-05. `links.docs` preserves verified per-entry URLs, including fragments where the source uses one catalog page. Source-specific annotations and evidence notes live in [registries](../../registries). Categories, aesthetics, and tags are curator judgments; unverified visual scales remain unknown and compatibility booleans absent. No upstream component source is copied into this package.

`dependencyStatus` defaults to `unknown` for absent input. Every curated record explicitly has unknown status and an empty dependency array: this is incomplete metadata, never a claim of zero dependency cost. Verified completeness, including a verified empty list, requires explicit `known` status. Beautiful UI's unverified framework uses `other`. Manual installation instructions link upstream guidance whenever no command was verified. Commands are plans that this package never executes.

Beautiful UI and public BeUI entries have verified MIT evidence links. Aceternity, HeroUI, and Efferd remain unknown-license records; free availability is not a license. See the [licensing rules](../../docs/security-licensing.md) before using upstream code.

Use `pnpm --filter @tessera/registry test`, `typecheck`, and `build` during development, and run the root checks before committing.
