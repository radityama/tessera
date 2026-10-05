# Aceternity registry

Four manually reviewed metadata records live in the [canonical snapshot](../../packages/registry/src/data/registry.json). Review date: 2026-10-05. The [official catalog](https://ui.aceternity.com/components) identifies React components; each selected documentation page was checked for its identity and installation command.

| ID and verified page                                                                         | Curator annotations and basis                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [aceternity/terminal](https://ui.aceternity.com/components/terminal)                         | `terminal`, secondary `card`; technical aesthetic and CLI/code/typewriter tags reflect a terminal display with command typing |
| [aceternity/spotlight](https://ui.aceternity.com/components/spotlight)                       | `background`, secondary `hero`; atmospheric annotation describes the documented light accent around content                   |
| [aceternity/background-lines](https://ui.aceternity.com/components/background-lines)         | `background`, secondary `hero`; flowing annotation and SVG/lines/waves tags describe the documented wave paths                |
| [aceternity/text-generate-effect](https://ui.aceternity.com/components/text-generate-effect) | `animation`, secondary `hero`; expressive annotation and text/reveal tags describe the documented sequential text appearance  |

All four pages explicitly show `npx shadcn@latest add @aceternity/<slug>`. The Terminal page additionally requires `public/sounds/sound.ogg` when using sound; that requirement appears in installation instructions and the asset is not bundled. Commands are returned as metadata only.

License remains `unknown`: no component-scoped license evidence was verified. Runtime/peer/development dependency requirements are incomplete, represented by empty lists with `dependencyStatus: "unknown"`; they do not mean zero dependencies. Motion intensity, density, radius, surfaces, and per-record compatibility have not been measured or verified and remain unknown/absent. A documented animation does not by itself establish an intensity enum value.

Category, aesthetic, and tag annotations are curator judgments, not upstream guarantees. Source links preserve original component identity; demo branding and copy are not included. Provenance is `manual` with a UTC review timestamp. Only bounded catalog/docs metadata was reviewed; no upstream source code or assets are stored.
