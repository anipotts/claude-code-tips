# codex launch check ledger

date: 2026-08-07

## implementation checks

| check | result | evidence |
|---|---|---|
| astro type check | pass | `bun run check`: 11 files, 0 errors, 0 warnings |
| production build | pass | `bun run build`: 12 static pages plus pagefind and sitemap |
| canonical h1 | pass | one exact match at `/` in the browser |
| horizontal overflow | pass | none at 375, 768, 1024, or 1440 pixels |
| desktop evidence rail | pass | visible beside the codex guide at 1440 pixels |
| mobile evidence summary | pass | four entries beneath codex guide metadata at 375 pixels |
| active internal markdown links | pass | active guide links use public routes rather than source filenames |

## recovery notes

the first schema check exposed yaml date coercion in `lastVerified` and section
anchors. the schema now accepts a date value and renders it as iso 8601. the
first production build also exposed a missing astro-icon integration. adding
the pinned integration fixed the build without replacing icons with improvised
assets.

these were recoverable implementation failures. raw tool output is omitted
because the public evidence contract excludes transcripts and private paths.
