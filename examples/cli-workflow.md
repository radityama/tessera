# Example: developer CLI landing page retrieval

Goal: dark, technical landing page for a developer CLI with a terminal demo.

```bash
node packages/cli/dist/cli.js search "technical dark hero for a developer CLI, subtle motion, terminal-oriented" --limit 5
# → beautifului/terminal-hero ranks first (hero + terminal, motion low, MIT, 1 dep)

node packages/cli/dist/cli.js inspect beautifului/terminal-hero
node packages/cli/dist/cli.js add beautifului/terminal-hero --dry-run

node packages/cli/dist/cli.js search "animated grid background subtle" --category background --limit 3
node packages/cli/dist/cli.js search "developer command menu" --category command-menu --limit 3
```

Then adapt every chosen block to one design language (small radius, restrained borders, flat+outlined surfaces, single motion speed) and build the product-specific install-and-run workflow section from scratch. See `skills/tessera/SKILL.md`.
