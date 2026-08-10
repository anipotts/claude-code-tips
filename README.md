# coding agent tips

evidence-backed guidance for coding agents in production software, from
individual projects to startups and big tech.

[read the publication](https://agents.anipotts.com) or go directly to a guide:

| guide | focus |
|---|---|
| [codex](https://agents.anipotts.com/guides/codex/) | cli, desktop, ide, cloud, worktrees, permissions, and durable configuration |
| [claude code](https://agents.anipotts.com/guides/claude-code/) | terminal, desktop, ide, skills, hooks, agents, and permissions |
| [shared operating system](https://agents.anipotts.com/guides/operating-system/) | authority, isolation, verification, handoffs, and review |
| [market and hardware](https://agents.anipotts.com/market/) | surfaces, harnesses, models, orchestration, and local-resource economics |

## evidence standard

the guide separates four states:

- `hands-on`: reproduced by the author with the product and date identified.
- `source-verified`: checked against a linked primary source.
- `inference`: a reasoned recommendation built from stated evidence.
- `unknown`: a material gap that remains visible.

the [field lab](https://agents.anipotts.com/field-lab/) publishes task
specifications, sanitized run records, checks, artifacts, redactions, and
limitations. current claude code guidance remains source-verified until the
paired hands-on run is complete.

## repository map

- `docs/` contains the canonical markdown, source registry, decisions, and
  field-run records.
- `src/` renders the astro and starlight publication.
- `plugins/` and `hooks/` are frozen compatibility surfaces through
  2026-11-05.
- `.github/` contains deterministic validation, read-only freshness checks,
  and the github pages workflow.

## local verification

```bash
bun install --frozen-lockfile
bun run check:field-runs
bun run check
bun run build
bun run test:site
bun run test:a11y
```

legacy plugin paths and their final-support policy are documented at
[agents.anipotts.com/legacy](https://agents.anipotts.com/legacy/).

built and maintained by [ani potts](https://anipotts.com). corrections with
primary sources and reproducible field evidence are welcome.

MIT
