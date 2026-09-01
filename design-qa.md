# design QA

## source truth

- selected visual: `/Users/anipotts/.codex/generated_images/01a054ef-f6be-77d3-875d-4ef0913b9c31/exec-751df81c-0eea-4aa3-bff7-5e0a2e9120a3.png`
- selected visual dimensions: 1487 x 1058
- normalized comparison source: `/tmp/coding-agent-tips-unified-sidebar-reference-1440.png`
- implementation capture: `/tmp/coding-agent-tips-unified-sidebar-final.png`
- comparison viewport and state: 1440 x 1024, light theme, `/guides/codex/`, expanded guide navigation, document at top
- normalization: the selected visual was resampled to 1440 x 1024. Its aspect ratio differs from the implementation viewport by less than 0.1 percent.

## combined comparison evidence

- full viewport, selected visual on the left and implementation on the right: `/tmp/coding-agent-tips-unified-sidebar-comparison.png`
- focused guide rail, selected visual on the left and implementation on the right: `/tmp/coding-agent-tips-unified-sidebar-sidebar-comparison.png`
- the full comparison was inspected as one 2880 x 1024 image.
- the focused comparison was inspected as one 696 x 960 image.

## findings and iterations

### P0

- none.

### P1

- first implementation pass placed the article title at x = 460 while the selected visual placed it at about x = 421. The desktop content margin was reduced from 5.5rem to 3.25rem. Final title x = 424 and page actions x = 1055, matching the selected visual within a few pixels.
- the first unified outline used 13px text with an 18.4px line height. It was increased to the established 14px / 20px navigation role so the result remains readable and passes the project typography contract.

### P2

- the selected visual uses title case for `Codex Guide`; the implementation keeps the repository's canonical lowercase interface voice as `codex guide`.
- the selected visual draws persistent tree connector lines between nested headings. The implementation uses indentation and the active cobalt marker from the existing navigation system, avoiding a second decorative timeline treatment.
- the selected visual uses generated icon approximations. The implementation retains the project's existing provider and chapter icons.

### P3

- minor antialiasing and line wrap differences remain because the selected visual is generated raster art while the implementation uses live Instrument Sans and IBM Plex Mono text.

## functional QA

- desktop expanded state: left rail 348px, right rail 0px, no horizontal overflow.
- desktop collapsed state: guide outline hidden, left state `collapsed`, right state `collapsed`, retired right rail remains 0px, and no horizontal overflow.
- desktop restore: left state returns to `expanded`; active outline tracking remains on exactly one heading.
- mobile 375 x 812: desktop rail hidden, title and copy action share one justified row, no horizontal overflow.
- compact chapter and page outline controls both open, replace one another, report their expanded state, and close again.
- browser console: no errors observed during the desktop and mobile interaction pass.

## validation

- Astro diagnostics: passed with 0 errors, 0 warnings, and 0 hints.
- navigation interaction suite: passed.
- content contracts: passed.
- site route, metadata, redirect, link, sitemap, and identity checks: passed.
- performance media budgets: passed.
- production build: passed.
- typography, reflow, text spacing, text resize, and axe checks: passed across 17 routes at 8 required widths.

final result: passed
