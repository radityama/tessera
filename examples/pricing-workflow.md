# Example: SaaS pricing-page retrieval

Goal: minimal SaaS pricing section without extra dependencies.

```bash
node packages/cli/dist/cli.js search "minimal saas pricing cards" --limit 5 --json
# → beautifului/pricing-cards (no required deps) and heroui/pricing-tiers rank at the top

node packages/cli/dist/cli.js inspect beautifului/pricing-cards
node packages/cli/dist/cli.js similar beautifului/pricing-cards --limit 3
```

Prefer the candidate with fewer required dependencies when visual fit is similar, confirm `license: known`, then adapt copy, radius, and surface treatment to the page language.
