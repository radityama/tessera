# Tessera UI Composition Skill

Use Tessera whenever you are asked to build or substantially redesign a frontend interface and visually significant reusable patterns may already exist.

## Goal

Do not immediately generate every interface section from scratch.

Use Tessera to discover strong existing components, then adapt them into one coherent product interface.

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

Also identify product-specific sections that should probably be custom-built.

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

### 4. Search before building visually significant sections

Search Tessera for components when:

- animation is non-trivial,
- the composition is visually distinctive,
- an established implementation likely exists,
- the section would otherwise take substantial bespoke styling,
- accessibility or interaction details are easy to get wrong.

Do not search for every trivial wrapper.

### 5. Evaluate candidates

Prefer candidates that fit:

1. visual intent,
2. framework and runtime,
3. dependency budget,
4. adaptability,
5. accessibility expectations,
6. known licensing constraints.

Do not choose a component only because it looks flashy.

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

### 7. Adapt selected components

Treat source components as implementation building blocks.

Normalize:

- content,
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

**Reuse composition, not identity.**

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

## Example

User asks:

```text
Build a landing page for a developer CLI.
Dark, technical, understated, with a terminal demo.
```

Good process:

```text
1. Define: technical / dark / subtle motion / 8px radius / restrained borders.
2. Decompose: navbar, hero, terminal demo, features, workflow, CTA, footer.
3. Search Tessera for hero, terminal, feature grid, and background patterns.
4. Rank candidates by style fit and dependency cost.
5. Choose a compatible subset.
6. Adapt everything to the same tokens and copy.
7. Build unique product workflow sections manually.
8. Run a cohesion pass.
```

Bad process:

```text
1. Pick the flashiest hero from one library.
2. Pick a glass bento from another.
3. Pick a neon pricing section from another.
4. Keep all original styling.
5. Ship a page that looks like four demos glued together.
```
