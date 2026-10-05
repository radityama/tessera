# UI Composition Principles

These principles guide the Tessera skill and any future adaptation tooling.

## 1. Decompose first

Before coding, identify page-level sections and product-specific interaction areas.

## 2. Search visually significant sections

Search the registry for sections where existing implementation quality matters:

- hero compositions,
- animated demos,
- backgrounds,
- bento layouts,
- pricing structures,
- complex navigation,
- command menus,
- data visualizations.

Do not waste retrieval on trivial wrappers and one-off dividers.

## 3. Establish a design language before selection

The agent should infer or define:

- typography,
- spacing rhythm,
- radius,
- border contrast,
- shadow usage,
- surface treatment,
- motion intensity,
- density,
- max content width,
- grid logic.

## 4. Rank for cohesion, not spectacle

A component that looks excellent in isolation can still be a bad choice.

Prefer components that can be normalized into the same page language.

## 5. Adapt everything imported

At minimum check:

- color tokens,
- font family and weights,
- spacing,
- radius,
- border styles,
- shadows,
- icon style,
- animation timing,
- responsive behavior,
- product copy,
- accessibility labels.

## 6. Keep product-specific UI original

A unique workflow, editor, domain interaction, or product demo may deserve a custom implementation even if a generic component exists.

## 7. Run a cohesion pass

After composition, inspect the page globally.

Look for:

- conflicting radius systems,
- inconsistent animation speeds,
- mismatched surface styles,
- too many gradients,
- duplicate visual tricks,
- inconsistent section density,
- typography drift.
