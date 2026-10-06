# Tessera Docs

Static site rendering the Markdown in `docs/`.

```bash
pnpm --filter @tessera-dev/docs build     # writes apps/docs/dist
```

The documentation itself lives in [`docs/`](../../docs) and is the source of truth — this app only
renders it. Edit the Markdown, not the generated output.
