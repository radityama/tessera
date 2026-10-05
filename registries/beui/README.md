# BeUI registry

Four public-library entries live in the [canonical snapshot](../../packages/registry/src/data/registry.json), reviewed on 2026-10-05 from the [official homepage](https://beui.dev/), [catalog](https://beui.dev/components/motion), and selected component pages. The homepage and catalog explicitly identify React components. The public library is distinct from BeUI Pro.

| ID and verified page                                                       | Curator annotations and basis                                                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [beui/button](https://beui.dev/components/motion/button)                   | `other` because no button category exists; expressive annotation and button/press-feedback tags reflect documented spring press interactions |
| [beui/dock](https://beui.dev/components/motion/dock)                       | `navigation`; expressive annotation and dock/actions tags reflect grouped actions and the moving selection indicator                         |
| [beui/tabs](https://beui.dev/components/motion/tabs)                       | `navigation`; expressive annotation and tabs/indicator tags reflect tab selection with a spring indicator                                    |
| [beui/command-palette](https://beui.dev/components/blocks/command-palette) | `command-menu`; expressive annotation and search/commands/keyboard tags reflect the documented command-search palette                        |

The homepage's public-library section and FAQ explicitly state MIT licensing and distinguish the separate paid Pro license. `license.status: "known"`, identifier `MIT`, and evidence URL `https://beui.dev/` apply to these public entries. The metadata preserves that limited scope and the requirement to retain applicable notices.

The homepage explicitly gives `bunx --bun shadcn add @beui/button`, which is recorded for Button. Other entries use manual guidance to their verified pages and the shared theme setup. The page text exposes animated CLI labels with repeated letters; the snapshot does not reconstruct those commands by guessing. No commands are executed.

Per-component complete dependency sets were not established. Empty lists with `dependencyStatus: "unknown"` do not mean zero dependencies, even though the docs describe shared Motion/Tailwind prerequisites and may list additional packages. Compatibility booleans remain absent, and motion intensity/density/radius/surfaces remain unknown. Aesthetics and functional/category annotations are curator judgments based on catalog descriptions, not measured guarantees. Provenance is `manual` with a UTC review timestamp. No upstream component source is vendored.
