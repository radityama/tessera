# Canonical Component Model

Every source library must normalize into one canonical shape.

The exact TypeScript implementation may evolve, but the semantic model should remain stable.

```ts
export type ComponentCategory =
  | "hero"
  | "navbar"
  | "feature"
  | "pricing"
  | "testimonial"
  | "cta"
  | "footer"
  | "background"
  | "navigation"
  | "form"
  | "card"
  | "table"
  | "dashboard"
  | "data-visualization"
  | "command-menu"
  | "terminal"
  | "animation"
  | "pattern"
  | "other";

export interface TesseraComponent {
  schemaVersion: 1;

  id: string;
  source: string;
  slug: string;
  name: string;
  description?: string;

  category: ComponentCategory;
  secondaryCategories: ComponentCategory[];

  frameworks: Array<"react" | "vue" | "svelte" | "html" | "other">;

  compatibility: {
    nextjs?: boolean;
    clientComponent?: boolean;
    typescript?: boolean;
  };

  visual: {
    aesthetics: string[];
    tags: string[];
    motion: "none" | "low" | "medium" | "high" | "unknown";
    density: "compact" | "normal" | "spacious" | "unknown";
    radius: "none" | "small" | "medium" | "large" | "mixed" | "unknown";
    surface: Array<
      "flat" | "glass" | "elevated" | "outlined" | "gradient" | "unknown"
    >;
  };

  dependencies: Array<{
    name: string;
    kind: "runtime" | "dev" | "peer" | "unknown";
    required: boolean;
  }>;

  dependencyStatus: "known" | "unknown";

  installation: {
    kind: "command" | "copy" | "package" | "manual" | "unknown";
    command?: string;
    instructions?: string;
  };

  links: {
    homepage?: string;
    docs?: string;
    preview?: string;
    source?: string;
  };

  license: {
    status: "known" | "unknown";
    identifier?: string;
    source?: string;
    notes?: string;
  };

  provenance: {
    adapter: string;
    retrievedAt?: string;
    sourceVersion?: string;
  };
}
```

## Stable IDs

Use:

```text
<source>/<slug>
```

Examples:

```text
aceternity/spotlight
beautifului/prompt-bar
beui/command-palette
```

IDs must remain stable once published unless the upstream component truly changes identity.

## Unknown metadata

Never guess.

Use `unknown`, `undefined`, or an explicit status field.

Unknown license status is not equivalent to permissive license.

`dependencyStatus` describes whether the dependency list is verified complete. It defaults to `unknown` when absent from input. An empty `dependencies` list with unknown status means the dependencies have not been established; it must not receive dependency-free ranking credit. Use `known` only after reviewing the complete requirements, including peer and development prerequisites where relevant. A verified empty list with `known` explicitly claims no package dependencies.

`frameworks` must contain at least one supported enum value. Use `other` as the catchall when a framework is unsupported or unverified, and explain that uncertainty in source notes. It does not establish React, Vue, Svelte, or HTML compatibility. Absent compatibility booleans carry no positive or negative compatibility claim.

All record and nested objects are strict: unknown keys are rejected rather than stripped. Source and slug match `^[a-z0-9]+(?:-[a-z0-9]+)*$`; `id` must exactly equal `source/slug`. Supplied text cannot be empty or whitespace-only. Links and license evidence must use absolute HTTP(S) URLs. Known license status requires a nonempty identifier and evidence URL; unknown status cannot include an identifier. Review timestamps use ISO 8601 datetimes with UTC or explicit offsets.

Installation kind `command` requires a command, `manual` and `copy` require instructions, and `package` requires a command or instructions. These values are metadata only; validation never executes commands.

The snapshot shape is `{ schemaVersion: 1, components: TesseraComponent[] }`. Both versions are validated, and duplicate IDs report the conflicting component index. Empty snapshots are valid. `parseRegistry` preserves input order; merged and default snapshots sort IDs with ASCII comparison. Public types are inferred from the Zod schemas exported by `@tessera/registry`.
