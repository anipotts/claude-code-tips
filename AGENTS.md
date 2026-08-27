# coding agent tips

this repository is an opinionated, source backed handbook for experienced coding agent users. codex and claude code are coequal primary guides. archived claude code plugins remain available only for the compatibility window documented in `docs/archive.md`.

## public standard

- write for a staff engineer, hiring manager, or technically serious builder who may encounter one page without prior context.
- separate tested behavior, official product facts, analysis, and open questions.
- prefer primary sources and record them in `docs/sources.json`.
- do not use generated activity, commit frequency, or vendor benchmarks as evidence of quality.
- keep the voice direct, lowercase, and professional. avoid hype, fan language, and unsupported authority claims.
- do not use mid-dot dividers in public copy or interface labels.
- never use litotes or negative comparison frames in public copy. state the intended claim directly.
- repeat context only when it changes understanding or supports a deliberate editorial rhythm. remove labels that restate the title, route, or surrounding section.
- preserve compatibility paths through 2026-11-05. archive changes are limited to security, data loss, and installation blockers.

## canonical ownership

- `content/home.md` owns the homepage.
- `docs/guides/*.md`, `docs/history.md`, `docs/market.md`, and `docs/method.md` own the principal handbook destinations.
- `content/runs/*.md` owns field run metadata and prose.
- `docs/sources.json` owns source metadata, current product versions, and evidence definitions.
- `src/site.ts` owns shared navigation and interface copy.
- components render canonical metadata. they do not own guide summaries, product explanations, recommendations, or versions.
- run `bun run sync:readme` after changing a principal guide title or evidence label. the generated README blocks must match before validation passes.
- review the active public surface at `/__copy-review/` during local development. production builds exclude this route.
- normal public prose does not use hyphens. preserve them only for syntax, routes, filenames, commands, URLs, version identifiers, and official product names.

## verification

run the source, field run, Astro, generated route, Markdown, and shell checks before publishing a broad change. run `bun test plugins/cc/tests` and `pytest plugins/lore/tests` when archive files or shared runtime dependencies change, and during the scheduled full verification.

- protected pull requests must use a committer identity GitHub recognizes. local cryptographic verification is supporting evidence; GitHub's `verified=true` result is the merge gate.
- use `--body-file` for GitHub pull request or release text that contains Markdown code spans or shell syntax. never pass that content through an inline shell argument.
- use the package scripts for Astro development, editing, checks, builds, and previews. they invoke Astro through Node so a restarted shell does not need Bun on `PATH` for those commands.

## review

evaluate factual support, taxonomy, safety, maintenance cost, and whether the recommendation follows from the evidence. do not optimize prose for engagement at the expense of precision.
