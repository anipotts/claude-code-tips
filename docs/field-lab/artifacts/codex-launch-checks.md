# codex launch check ledger

date: 2026-08-09

## implementation checks

| check | result | evidence |
|---|---|---|
| astro type check | pass | `bun run check`: 13 files, 0 errors, 0 warnings, 0 hints |
| production build | pass | `bun run build`: 13 static pages plus pagefind and sitemap |
| canonical h1 | pass | one exact match at `/` in the browser |
| horizontal overflow | pass | none at 375, 768, 1024, or 1440 pixels |
| responsive route matrix | pass | all 12 public routes checked at four widths with one h1, a 64-pixel header, canonical metadata, and no overflow |
| publication shell | pass | home and guide headers are 64 pixels; their desktop content shares one left edge |
| desktop evidence rail | pass | full-height rail visible beside guides at 1440 pixels |
| mobile evidence summary | pass | closed disclosure beneath guide metadata at 375 pixels |
| mobile primary navigation | pass | homepage and field-run routes expose the same four destinations as the desktop header |
| active internal markdown links | pass | active guide links use public routes rather than source filenames |
| documentation links | pass | pinned lychee 0.24.2 resolved root-relative routes against the built site and checked 55 reachable links with no errors |
| editorial separators | pass | public routes contain no mid-dot dividers |
| github repository signal | pass | github icon and 27-star count appear in the shared header |
| production dependency audit | pass | `bun audit --production`: no vulnerabilities found |

## pre-merge gates

- the github actions accessibility scan remains required because the local
  sandbox cannot launch its pinned chromium process.
- direct 200 percent browser zoom could not be exercised through the in-app
  browser permission boundary. the 375 through 1440 responsive reflow checks do
  not substitute for that final manual check.
- twelve links to the future custom domain and renamed repository are explicit
  prelaunch exclusions. remove the exclusions and rerun the check after cutover.

## recovery notes

the first schema check exposed yaml date coercion in `lastVerified` and section
anchors. the schema now accepts a date value and renders it as iso 8601. the
first production build also exposed a missing astro-icon integration. adding
the pinned integration fixed the build without replacing icons with improvised
assets.

these were recoverable implementation failures. raw tool output is omitted
because the public evidence contract excludes transcripts and private paths.

the first pull-request link check also exposed a rollout-order problem: it tried
to verify root-relative routes without the built site and treated the future
repository and custom domain as already live. the link check now runs beside the
production build, resolves internal routes against that output, and excludes
only the two named cutover targets until deployment.
