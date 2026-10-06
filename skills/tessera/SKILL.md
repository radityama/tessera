---
name: tessera
description: Search existing UI component registries before building visually significant frontend sections, then adapt candidates into one coherent page design language.
version: 0.1.0
---

# Tessera UI Composition Skill

Use Tessera whenever you are asked to build or substantially redesign a frontend interface and visually significant reusable patterns may already exist.

## Goal

Do not immediately generate every interface section from scratch.

Use Tessera to discover strong existing components, then adapt them into one coherent product interface.

## When to use Tessera

Search Tessera for a section when any of these is true:

- animation is non-trivial,
- the composition is visually distinctive,
- an established implementation likely exists,
- the section would otherwise take substantial bespoke styling,
- accessibility or interaction details are easy to get wrong (menus, dialogs, forms, tables).

Do not search for trivial wrappers, one-off dividers, or product-specific domain interactions. Build those directly.

## Workflow

### 1. Understand the page

Identify:

- product type,
- target audience,
- visual tone,
- information hierarchy,
- interaction requirements,
- target framework,
- existing design system.

### 2. Decompose the UI

Break the page into meaningful sections such as:

- navbar,
- hero,
- social proof,
- feature section,
- product demo,
- comparison,
- pricing,
- testimonial,
- CTA,
- footer.

Also identify product-specific sections that should probably be custom-built (editors, domain visualizations, unique workflows). Mark those `custom — do not search`.

### 3. Establish the design language

Before choosing components, infer or define:

```yaml
typography: sans / serif / mono roles
radius: none / small / medium / large
borders: none / subtle / strong
shadows: none / minimal / elevated
motion: none / restrained / expressive
density: compact / normal / spacious
surface: flat / glass / elevated / outlined
layout: max width + grid logic
```

Every candidate must be judged against this language, not in isolation.

### 4. Search before building visually significant sections

Prefer one targeted query per section. Include tone, product context, and motion intent:

```bash
tessera search "technical dark hero for a developer CLI, subtle motion, terminal-oriented" --limit 5
tessera search "minimal saas pricing cards" --category pricing --limit 5
tessera search "animated grid background subtle" --category background --limit 5
tessera search "developer command menu" --category command-menu --limit 5
```

Inspect before choosing:

```bash
tessera inspect beautifului/terminal-hero
tessera similar beautifului/terminal-hero --limit 3
tessera add beautifului/terminal-hero --dry-run
```

Via MCP, the same capability is `search_components` → `get_component` → `get_installation` → `find_similar_components`. CLI JSON (`--json`) and MCP results represent the same canonical records and scores.

Read the score reasons. Prefer candidates whose reasons cite category fit, aesthetic fit, motion fit, and low dependency cost — not spectacle.

### 5. Evaluate candidates

Prefer candidates that fit, in this order:

1. visual intent,
2. framework and runtime,
3. dependency budget,
4. adaptability,
5. accessibility expectations,
6. known licensing constraints.

Rules:

- Do not choose a component only because it looks flashy.
- Treat `license: unknown` as blocked for vendoring until the upstream terms are confirmed.
- Reject framework-incompatible candidates even when they look ideal.
- Prefer fewer required dependencies when visual fit is otherwise similar.
- Do not automatically reject a motion library when the user explicitly asked for animation.

### 6. Preserve cohesion

Do not independently pick the most impressive component for each section.

The page must feel like one design system.

Reject candidates that introduce conflicting:

- typography,
- radius,
- motion language,
- surface treatment,
- density,
- iconography,
- visual gimmicks.

If two strong candidates conflict (for example a glass navbar with a flat technical hero), keep the one closer to the page language and keep searching for the other section.

### 7. Adapt selected components

Treat source components as implementation building blocks.

Normalize:

- content and product copy,
- brand colors,
- typography,
- spacing,
- radius,
- borders,
- shadows,
- icons,
- motion timing,
- responsive behavior,
- accessibility labels.

**Reuse composition, not identity.** Never ship third-party demo branding, copy, color systems, or product identity unchanged.

### 8. Build custom UI when appropriate

Build from scratch when:

- no candidate fits,
- adapting a candidate is more expensive than implementing it,
- the UI is product-specific,
- the component would introduce unnecessary dependencies,
- license status blocks reuse.

### 9. Final cohesion pass

Before considering the page complete, inspect the full interface for:

- mismatched radii,
- inconsistent section spacing,
- too many gradients,
- inconsistent animation speeds,
- repeated visual tricks,
- typography drift,
- awkward responsive transitions,
- inaccessible contrast or interaction.

## Worked example (good)

User asks:

```text
Build a landing page for a developer CLI.
Dark, technical, understated, with a terminal demo.
```

Good process:

```text
1. Define: technical / dark / subtle motion / small radius / restrained borders / flat+outlined surfaces.
2. Decompose: navbar, hero, terminal demo, features, workflow (custom), CTA, footer.
3. Search:
   - tessera search "technical dark hero for a developer CLI, subtle motion, terminal-oriented"
     → beautifului/terminal-hero (hero + terminal secondary, motion low, 1 dep, MIT)
   - tessera inspect beautifului/terminal-hero (check install + license)
   - tessera search "developer command menu" (only if a palette is needed)
   - tessera search "animated grid background subtle" --category background
4. Choose a compatible subset: terminal hero + grid background + feature list with the same
   radius, borders, and restrained motion. Reject the expressive aurora background.
5. Adapt everything to the same tokens and product copy.
6. Build the unique install-and-run workflow section manually.
7. Run the cohesion pass: one radius, one border style, one motion speed.
```

## Anti-example (bad)

```text
1. Pick the flashiest hero from one library (expressive aurora, high motion).
2. Pick a glass bento from another library.
3. Pick a neon pricing section from another library.
4. Keep all original styling, copy, and gradients.
5. Ship a page that looks like four demos glued together.
```

Why it fails: each section is locally attractive but the radius systems, motion speeds, surfaces, and typography conflict; dependency cost triples; nothing was adapted to the product.

## Safety notes

- `tessera add --dry-run` only prints a plan. Nothing mutates the project in v0.1.
- MCP tools never execute shell commands and never install dependencies automatically.
- Unknown-license components must not be vendored silently; surface the warning to the user.
