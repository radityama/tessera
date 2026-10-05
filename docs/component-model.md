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
  | "other"

export interface TesseraComponent {
  schemaVersion: 1

  id: string
  source: string
  slug: string
  name: string
  description?: string

  category: ComponentCategory
  secondaryCategories: ComponentCategory[]

  frameworks: Array<"react" | "vue" | "svelte" | "html" | "other">

  compatibility: {
    nextjs?: boolean
    clientComponent?: boolean
    typescript?: boolean
  }

  visual: {
    aesthetics: string[]
    tags: string[]
    motion: "none" | "low" | "medium" | "high" | "unknown"
    density: "compact" | "normal" | "spacious" | "unknown"
    radius: "none" | "small" | "medium" | "large" | "mixed" | "unknown"
    surface: Array<"flat" | "glass" | "elevated" | "outlined" | "gradient" | "unknown">
  }

  dependencies: Array<{
    name: string
    kind: "runtime" | "dev" | "peer" | "unknown"
    required: boolean
  }>

  installation: {
    kind: "command" | "copy" | "package" | "manual" | "unknown"
    command?: string
    instructions?: string
  }

  links: {
    homepage?: string
    docs?: string
    preview?: string
    source?: string
  }

  license: {
    status: "known" | "unknown"
    identifier?: string
    source?: string
    notes?: string
  }

  provenance: {
    adapter: string
    retrievedAt?: string
    sourceVersion?: string
  }
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
beautifului/terminal-hero
beui/grid-hero
```

IDs must remain stable once published unless the upstream component truly changes identity.

## Unknown metadata

Never guess.

Use `unknown`, `undefined`, or an explicit status field.

Unknown license status is not equivalent to permissive license.
