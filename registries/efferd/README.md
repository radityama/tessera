# Efferd registry

Four reviewed records live in the [canonical snapshot](../../packages/registry/src/data/registry.json), based on the [official blocks catalog](https://efferd.com/blocks), [hero catalog](https://efferd.com/blocks/hero), [pricing catalog](https://efferd.com/blocks/pricing), [homepage](https://efferd.com/), and [installation documentation](https://efferd.com/docs). Review date: 2026-10-05. The homepage explicitly describes React-framework compatibility. Actual category-page fragment URLs were verified.

| ID and verified page                                            | Curator annotations and basis                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [efferd/hero-1](https://efferd.com/blocks/hero#hero-1)          | `hero`; centered/announcement/radial-gradient tags reflect the catalog description                 |
| [efferd/hero-2](https://efferd.com/blocks/hero#hero-2)          | `hero`; borders/gradient-text tags reflect its described accents                                   |
| [efferd/hero-3](https://efferd.com/blocks/hero#hero-3)          | `hero`; left-aligned/dashboard-preview tags reflect its described composition                      |
| [efferd/pricing-1](https://efferd.com/blocks/pricing#pricing-1) | `pricing`, secondary `card`; monthly/yearly/discount tags reflect its described side-by-side plans |

`minimal` is a curator annotation about these focused compositions, not an upstream guarantee. Motion intensity, density, radius, and surfaces were not measured and remain unknown; gradient tags do not assert that every selectable style has a gradient surface.

The catalogs label these entries Free. Free availability does not establish a license or redistribution rights, so license status remains `unknown`. Dependency lists are incomplete: `dependencies: []` and `dependencyStatus: "unknown"` do not imply zero dependencies. Per-entry compatibility booleans remain absent.

The official docs explicitly show `bunx --bun shadcn add @efferd/hero-1`; only that verified command is recorded. Its instructions include the required `@efferd` registry namespace configuration and style choice. Other records provide manual guidance to the verified category anchor and installation docs. No commands are executed, no registry payloads or upstream source are downloaded, and no demo assets/copy are stored. Provenance is `manual` with a UTC review timestamp.
