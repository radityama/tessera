# Sources

Every source below was verified against the provider's own registry or repository on **2026-10-06**.
Nothing in this table comes from a search-engine snippet, a listicle, or an assumption.

Tessera is **not affiliated with any of these projects**. The names and links identify where
component metadata comes from, nothing more.

## Supported sources

| Project           | Role in Tessera                                | Official source             | Retrieval mechanism                                                            | License status                                                                                                                                                                       |
| ----------------- | ---------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Aceternity UI** | Dark technical sections and motion primitives  | <https://ui.aceternity.com> | shadcn registry — `registry.json` plus `/registry/<name>.json` (`@aceternity`) | **`LicenseRef-Aceternity`** — a bespoke license, _not_ MIT. Use in personal and commercial projects is permitted; redistributing source files or reselling is not. Not OSI-approved. |
| **beUI**          | Animated React/Next.js components and blocks   | <https://beui.dev>          | shadcn registry — `/r/registry.json` plus `/r/<name>.json`                     | **MIT** for free components. A separate paid tier exists at `pro.beui.dev`.                                                                                                          |
| **Efferd**        | Shadcn blocks — heroes, pricing, dashboards    | <https://efferd.com>        | shadcn registry — `/r/registry.json` plus `/r/<name>.json`                     | **MIT for items in the open-source repository** (<https://github.com/shabanhr/efferd-ui>). Hosted items outside that repository are recorded as `unknown`.                           |
| **Magic UI**      | Motion-heavy decorative and marketing sections | <https://magicui.design>    | shadcn registry — `/r/registry.json` plus `/r/<name>.json`                     | **MIT** (<https://github.com/magicuidesign/magicui>)                                                                                                                                 |
| **HeroUI**        | Accessible React primitives                    | <https://www.heroui.com>    | npm package `@heroui/react`; no per-component registry endpoint exists         | **MIT** per the published npm metadata. Note the discrepancy below.                                                                                                                  |

### Removed source

**"Beautiful UI"** was listed as a source in this project's original scaffold and no longer is.
No component library by that name could be identified: the name resolves to unrelated repos,
Figma kits, and blog posts, and there is no official registry, package, or documentation site
behind it. The components previously attributed to it — including the repository's former
flagship example, `beautifului/terminal-hero` — were invented, as were its placeholder
`beautifului.example.com` URLs. They were removed rather than re-attributed.

## What Tessera stores

Metadata only:

- component name, slug and category,
- npm and registry dependencies,
- the retrieval mechanism and its exact upstream URL,
- license facts with an evidence URL and verification date,
- provenance: which adapter normalized the record, which upstream item it came from, when it
  was retrieved, and which fields Tessera inferred rather than read from upstream.

## What Tessera does not store

- **Component source code.** Snapshots contain no `files` content. Source is fetched on demand
  by `tessera fetch` and handed to the caller.
- Anything from a paid or authentication-gated catalogue. Items whose endpoint returns 401,
  403 or 404 are skipped during sync, because a component with no retrievable artifact does
  not belong in a catalogue that promises retrieval.
- Any claim Tessera could not verify. Where a license cannot be attributed to a specific
  component, the record says `unknown` rather than inheriting a sibling's license.

## Known license discrepancies

- **HeroUI** — the published npm package for `@heroui/react` declares `MIT`, and every package
  manifest in the repository agrees, but the repository's default branch (`v3`) ships an
  Apache-2.0 `LICENSE` file while `main` ships MIT. Tessera records the npm metadata, because
  that governs the artifact a user actually installs, and notes the conflict here.
- **Efferd** — the hosted catalogue (231 items) is much larger than the MIT repository
  (40 items). Efferd components are MIT only when they appear in that repository.

## Adding a source

See [`../registries/README.md`](../registries/README.md). A source may only be added with a
verifiable official registry or package, a license with an evidence URL, and a retrieval
mechanism that does not bypass access controls.
