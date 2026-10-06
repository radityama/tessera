---
name: tessera
description: Search existing UI component registries before building visually significant frontend sections, retrieve real implementations, and adapt them into one coherent page design language.
version: 0.1.0
---

# Tessera UI Composition Skill

Use Tessera when you are asked to build or substantially redesign a frontend interface and visually
significant reusable patterns may already exist.

## Goal

Do not generate every interface section from scratch. Find strong existing implementations, adapt
them into one coherent product interface.

The point is not to use Tessera more. It is to avoid rebuilding the generic parts of a page badly,
while keeping the page looking like one product rather than four demos.

## When to search

Search for a section when any of these is true:

- animation is non-trivial,
- the composition is visually distinctive,
- an established implementation likely exists,
- the section would otherwise take substantial bespoke styling,
- accessibility or interaction details are easy to get wrong (menus, dialogs, forms, tables).

Do not search for trivial wrappers, one-off dividers, or product-specific domain interactions.
Build those directly.

## Workflow

### 1. Understand the page

Product type, audience, visual tone, information hierarchy, interaction requirements, target
framework, and whether an existing design system applies.

### 2. Decompose the UI

Break the page into sections: navbar, hero, social proof, feature section, product demo, comparison,
pricing, testimonial, CTA, footer.

Mark product-specific sections — editors, domain visualizations, unique workflows — as
`custom — do not search`.

### 3. Establish the design language first

Before looking at any component, write down the language you are targeting:

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

Every candidate is judged against this. A component that is excellent in the abstract is still
wrong if it disagrees with this list.

### 4. Search

One targeted query per section. Include tone, product context and motion intent.

```bash
tessera search "dark technical hero developer cli subtle motion terminal" --limit 5
tessera search "minimal saas pricing cards" --category pricing --limit 5
tessera search "animated grid background subtle" --category background --limit 5
```

Read the score reasons. Prefer candidates whose reasons cite category fit, aesthetic fit, motion
fit and low dependency cost — not spectacle.

### 5. Inspect before choosing

```bash
tessera inspect magicui/terminal
tessera similar magicui/terminal --limit 3
```

Check four things, in this order:

1. **Licence.** `known` is not the same as reusable — check `redistribution` and `osiApproved` too.
   `unknown` is blocked for vendoring until upstream terms are confirmed.
2. **Retrievability.** `tessera search` reports `artifact: retrievable (…)` or `not retrievable (…)`.
   A component that ships compiled through npm has no files to adapt.
3. **Dependencies.** Two components with equal visual fit are not equal if one pulls in three
   runtime packages.
4. **Framework fit.** Reject incompatible candidates even when they look ideal.

### 6. Retrieve the real source

Do not guess what a component looks like from its name.

```bash
tessera fetch magicui/terminal --output ./vendor --dry-run   # inspect first
tessera fetch magicui/terminal --output ./vendor             # then write
```

Via MCP: `search_components` → `get_component` → `get_component_artifact`.

The artifact gives you the actual files, the npm dependencies and the licence. Nothing is
installed or executed — that decision is yours and the user's.

If a component is not retrievable, either work from its documented API or build the section
yourself. Do not approximate a component from its name.

### 7. Evaluate candidates for fit

Prefer, in order:

1. visual intent,
2. framework and runtime,
3. dependency budget,
4. adaptability,
5. accessibility expectations,
6. licence constraints.

Rules:

- Do not choose a component only because it looks flashy.
- Treat `license: unknown` as blocked for vendoring until upstream terms are confirmed.
- Prefer fewer required dependencies when visual fit is otherwise similar.
- Do not reject a motion library when the user explicitly asked for animation.

### 8. Preserve cohesion

Do not independently pick the most impressive component for each section.

Reject candidates that introduce conflicting typography, radius, motion language, surface
treatment, density, iconography or visual gimmicks.

If two strong candidates conflict — a glass navbar against a flat technical hero — keep the one
closer to the page language and keep searching for the other section.

### 9. Adapt what you retrieved

**Reuse composition, not identity.** Normalise content, copy, brand colours, typography, spacing,
radius, borders, shadows, icons, motion timing, responsive behaviour and accessibility labels.

Never ship a library's demo branding, copy or colour system unchanged. If the result still looks
like the library's landing page, you have not finished.

### 10. Build custom UI when appropriate

Build from scratch when no candidate fits, adapting costs more than implementing, the UI is
product-specific, the component drags in unnecessary dependencies, or the licence blocks reuse.

### 11. Final cohesion pass

Inspect the whole page for mismatched radii, inconsistent section spacing, too many gradients,
inconsistent animation speeds, repeated visual tricks, typography drift, awkward responsive
transitions, and inaccessible contrast or interaction.

## Worked example: rejecting a well-ranked candidate

This is the part that matters most, and the part most easily skipped.

```text
Ask: "Build a landing page for a developer CLI. Dark, technical, understated, terminal demo."

1. Design language, written down before searching:
   dark · small radius (4px) · hairline borders · flat/outlined surfaces · restrained motion ·
   mono for code only · comfortable density

2. Search: tessera search "dark technical hero developer cli subtle motion terminal"

   Results include:
     1. efferd/hero-1          0.640  hero        license unknown
     2. aceternity/hero-highlight 0.61  hero       redistribution restricted
     3. magicui/terminal       0.612  terminal    MIT

3. Reject #1 despite the rank: efferd/hero-1 has an unknown licence, and vendoring unknown
   licence code is not something to do quietly. Rejected on licensing, not on looks.

4. Inspect #2 and #3.
      aceternity/hero-highlight — retrievable, but redistribution restricted, and its radius
      and motion are larger than the page language allows.
      magicui/terminal — MIT, retrievable, small dependency footprint.

5. Retrieve: tessera fetch magicui/terminal --output ./vendor --dry-run

6. Adapt: replace the palette with project tokens, swap the demo copy for the real product
   copy, reduce the radius to 4px, drop the glow. It should no longer be recognisable as
   Magic UI's component.

7. Cohesion pass: one radius, one border weight, one motion speed across hero, features,
   pricing and footer.
```

Notice that two components were rejected — one for licensing, one for design-language conflict —
even though both ranked well. **Rank is a starting point, not a decision.**

## Anti-example

```text
1. Take rank #1 for every section without reading the reasons.
2. Pick an expressive aurora hero from one library, a glass bento from another, a neon
   pricing section from a third.
3. Keep all original styling, copy and gradients.
4. Ship a page that looks like four demos glued together, with triple the dependencies.
```

Why it fails: each section is locally attractive, but the radius systems, motion speeds, surfaces
and typography conflict; the dependency cost multiplies; nothing was adapted to the product; and
a licence constraint may have been ignored entirely on the way.

## Safety notes

- `tessera fetch` writes files only when you pass `--output`, never overwrites silently, and
  rejects upstream paths that would escape the output directory.
- `tessera add` is dry-run only in v0.1. Nothing mutates the project.
- MCP tools never execute shell commands, never install dependencies, and never run retrieved code.
- Surface licence warnings to the user rather than deciding on their behalf. A restricted
  redistribution licence may still be fine for their use — that is their call, not yours.
