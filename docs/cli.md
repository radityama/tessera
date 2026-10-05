# CLI

Binary name:

```text
tessera
```

## Search

```bash
tessera search "dark technical terminal hero"
```

Useful flags:

```text
--category hero
--framework react
--source beui
--motion low
--limit 10
--json
```

Human output should be readable; `--json` should be stable enough for scripting.

## Inspect

```bash
tessera inspect beautifului/terminal-hero
```

Shows canonical metadata, links, dependencies, license status, and installation guidance.

## Similar

```bash
tessera similar beautifului/terminal-hero
```

## Add

Initial behavior:

```bash
tessera add beautifului/terminal-hero --dry-run
```

In v0.1 this command may only produce a safe change plan.

Automatic mutation should not be introduced until project detection, conflict behavior, and rollback semantics are designed.

## Exit codes

Use non-zero exit codes for actual failures.

No results is not necessarily an internal failure; choose a documented behavior and test it.
