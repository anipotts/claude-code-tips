# codex + claude code field guide

this repository is an opinionated, source-backed handbook for experienced coding-agent users. codex and claude code are co-equal primary guides. legacy claude code plugins remain available only for the compatibility window documented in `docs/legacy-tools.md`.

## public standard

- write for a staff engineer, hiring manager, or technically serious builder who may encounter one page without prior context.
- separate observed behavior, official product facts, and inference.
- prefer primary sources and record them in `docs/sources.json`.
- do not use generated activity, commit frequency, or vendor benchmarks as evidence of quality.
- keep the voice direct, lowercase, and professional. avoid hype, fan language, and unsupported authority claims.
- preserve compatibility paths through 2026-11-05. legacy changes are limited to security, data-loss, and installation blockers.

## verification

run `python3 .github/scripts/check_sources.py`, shell and json syntax checks, `bun test plugins/cc/tests`, and `pytest plugins/lore/tests` before publishing a broad change.

## review

evaluate factual support, taxonomy, safety, maintenance cost, and whether the recommendation follows from the evidence. do not optimize prose for engagement at the expense of precision.
