# codex launch check ledger

date: 2026-08-09

## implementation checks

| check | result | evidence |
|---|---|---|
| astro type check | pass | `bun run check`: 13 files, 0 errors, 0 warnings, 0 hints |
| production build | pass | `bun run build`: 13 static pages plus pagefind and sitemap |
| canonical h1 | pass | one exact match at `/` in the browser |
| horizontal overflow | pass | none at 375, 768, 1024, or 1440 pixels |
| publication shell | pass | home and guide headers are 64 pixels; their desktop content shares one left edge |
| desktop evidence rail | pass | full-height rail visible beside guides at 1440 pixels |
| mobile evidence summary | pass | closed disclosure beneath guide metadata at 375 pixels |
| active internal markdown links | pass | active guide links use public routes rather than source filenames |
| editorial separators | pass | public routes contain no mid-dot dividers |
| github repository signal | pass | github icon and 27-star count appear in the shared header |

## recovery notes

the first schema check exposed yaml date coercion in `lastVerified` and section
anchors. the schema now accepts a date value and renders it as iso 8601. the
first production build also exposed a missing astro-icon integration. adding
the pinned integration fixed the build without replacing icons with improvised
assets.

these were recoverable implementation failures. raw tool output is omitted
because the public evidence contract excludes transcripts and private paths.
