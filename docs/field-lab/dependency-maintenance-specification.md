# codex dependency maintenance task specification

date: 2026-08-11

base commit: `89c2008351c3bfea178173e5a91d3d16558eaf10`

## outcome

update the publication's eligible framework and accessibility dependencies,
then prove that the reader experience and legacy compatibility remain stable.

## planned changes

- update astro from 7.2.0 to 7.2.1.
- update `@axe-core/playwright` from 4.12.1 to 4.13.0.
- keep typescript at 6.0.3 because `@astrojs/check` 0.9.10 supports
  typescript 5 and 6.
- limit generated dependency changes to `bun.lock`.

## pass conditions

- a frozen Bun install resolves the pinned dependency set.
- astro diagnostics and the production build pass.
- every published route, internal link, canonical URL, sitemap entry, and the
  exact homepage h1 pass the site regression suite.
- the field-run schema and source registry pass validation.
- the 45 `cc` tests and 175 `lore` tests remain green during the legacy window.
- Linux CI reports zero serious or critical accessibility findings.
- the deployed homepage and one guide render without horizontal overflow at
  375 pixels.
- the custom domain serves the updated build over HTTPS.

## evidence boundaries

- use the astro 7.2.1 and axe-core npm 4.13.0 release records as dependency
  evidence.
- record unavailable model, timing, and review measurements as `null` with a
  reason.
- keep the Claude Code product run pending. This task evaluates Codex operating
  the publication. Claude Code behavior stays outside this run.
- publish failures, skipped protocol scenarios, and operator interventions in
  the final run record.
