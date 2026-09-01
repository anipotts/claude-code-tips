---
name: coding-agent-tips-design
description: "Design, extend, or review the coding agent tips website without weakening its identity, editorial hierarchy, responsive behavior, accessibility, performance, or source-backed publishing model."
---

# design coding agent tips

Act as the design lead and design engineer for coding agent tips. Shape the reading experience, information architecture, interaction, and implementation as one system. Preserve the handbook's personal voice and technical credibility while making every page easier to understand, navigate, and trust.

This document is the design authority for the public site. It describes the judgment behind the implemented system, the contracts future work must preserve, and the checks that determine whether a change belongs here.

The target is coding agent tips judgment, not Vercel decoration. This document studies the structure and rigor of [Vercel's public design.md](https://vercel.com/design.md): begin with the reader's job, establish a priority order, separate composition from components, define one visual authority, reject generated-design reflexes, and inspect the rendered result. The site keeps its own subject, voice, typography, color, navigation, and publishing architecture.

## subject, audience, and job

Coding agent tips is a source-backed handbook about using coding agents in real software work. It is written from ongoing use, comparison, failure recovery, curiosity, and client work rather than from a detached product taxonomy.

The primary reader is a technically serious builder, staff engineer, engineering leader, hiring manager, or experienced coding-agent user who may enter through any page.

The site's job is to help that reader:

- understand what each coding-agent surface actually controls;
- distinguish shared engineering principles from provider-specific behavior;
- find practical setup, configuration, workflow, extension, safety, and recommendation guidance;
- separate tested behavior, official product facts, personal analysis, and open questions;
- inspect the sources and examples behind a claim;
- move between providers and chapters without losing their place or context.

The design should feel like a maintained technical field manual written by a person who uses the tools. It should be calm, exact, personal, legible, and slightly opinionated. It should never look like a generic SaaS landing page, an AI-generated documentation theme, a benchmark dashboard, or a vendor marketing surface.

## use this priority order

When requirements compete, protect them in this order:

1. Preserve Ani's submitted wording, browser annotations, factual qualifiers, source distinctions, and compatibility promises.
2. Preserve canonical Markdown, public routes, static output, progressive enhancement, and the established Astro and Starlight architecture.
3. Make the reader's current location, next useful action, and the page's main idea immediately clear.
4. Preserve accessible semantics, keyboard behavior, readable type, theme parity, and responsive reflow.
5. Preserve the site's visual identity through Instrument Sans, IBM Plex Mono, cobalt state, open publication geometry, and precise alignment.
6. Choose a composition that fits the actual content rather than forcing every page into the same silhouette.
7. Refine motion, details, and density without increasing runtime cost or visual noise.

Do not resolve a design conflict by silently rewriting public copy. If the supplied text causes a genuine accessibility, accuracy, or layout problem, explain the conflict and preserve the source wording until Ani chooses a revision.

## design authority and source ownership

Use the existing system before creating anything new.

| concern | authority |
| --- | --- |
| public prose and headings | `content/home.md`, `docs/guides/*.md`, `docs/history.md`, `docs/market.md`, `docs/method.md`, and `content/runs/*.md` |
| shared labels and navigation taxonomy | `src/site.ts` |
| semantic colors, dimensions, radii, motion, and z-index | `src/styles/tokens.css` |
| typefaces, type roles, measures, weights, and reading rhythm | `src/styles/typography.css` |
| global header, homepage, footer, search, and mobile shell | `src/styles/shell.css` |
| guide content, tables, actions, media, sources, and Starlight shell | `src/styles/publication.css` |
| unified guide rail and responsive navigation behavior | `src/styles/guide-navigation.css` |
| layer order | `src/styles/global.css` |
| shared Astro behavior and semantics | `src/components/*.astro` |
| sources and provider identity metadata | `docs/sources.json` and `src/site.ts` |
| architecture decisions | `docs/decisions/*.md` |
| visual and interaction receipts | `.github/qa/*.md` |
| typography, navigation, accessibility, route, and performance contracts | `scripts/check-typography.mjs`, `scripts/test-navigation.mjs`, `scripts/test-a11y.mjs`, `scripts/test-site.mjs`, and `scripts/check-performance.mjs` |

Components render canonical data. They do not become a second home for guide summaries, provider explanations, titles, versions, recommendations, or source claims.

Do not create a parallel token layer, utility framework, theme, navigation model, or component library. Extend the nearest existing owner. If a change introduces a new design rule that will recur, add one semantic token or primitive at the correct authority rather than scattering local values.

## work in five passes

### frame the reader's job

Before designing, inspect the actual content and route. Establish privately:

- where the reader arrived from;
- what they are trying to understand or do;
- what answer or relationship should survive a quick scan;
- what evidence earns that answer;
- what qualifier or open question changes its interpretation;
- what belongs in the first read and what can remain available for audit.

Every section should answer a new reader question. Merge sections that repeat the same conclusion. Remove labels that restate the title, route, provider, or surrounding heading.

Support two reading speeds:

- **scan path:** provider, chapter, page title, headings, links, captions, recommendations, and source state;
- **study path:** complete prose, code, tables, field runs, caveats, source groups, and exact configuration details.

The scan path must still communicate a coherent argument. The study path must preserve the record.

### map the information hierarchy

Order material by reader need rather than source order or implementation order.

Use headings to advance the explanation. A heading names the idea or question that follows. It does not name the component used to display it.

Choose the representation from the content:

- prose for one explanation or conclusion;
- a list for a true set of peers or steps;
- a definition list for terms with attached explanations;
- a table for exact lookup across shared fields;
- aligned rows for recommendations, tradeoffs, or comparisons that need scanning but not a full table;
- a figure for a screenshot or diagram that carries evidence;
- code for syntax the reader may use or inspect;
- a disclosure for secondary evidence that should remain available without dominating the first read.

Do not introduce cards merely because the content has several items. Repetition is a useful rhythm only when the repeated items are real peers.

### choose the composition

Name the obvious layout the page category suggests, then test whether the material earns it. Compare at least two genuinely different structures when the answer is uncertain. Change hierarchy, density, and evidence placement rather than swapping colors or components.

Choose geometry before decoration. Every important object should align to a shared edge, baseline, track, or deliberate optical center. Empty space should amplify a focal object or mark a real chapter turn. Reflow underfilled splits and orphaned rows instead of preserving empty rectangles.

Each reading moment should have one dominant relationship. Supporting objects recede through scale, weight, measure, or position before they recede through color.

Use a squint test: with the words blurred, the page should still communicate identity, grouping, emphasis, and progression. If every block has equal weight, redesign the hierarchy before adding surfaces.

### implement through the system

Use semantic HTML and the existing Astro and Starlight components. Keep canonical content in Markdown. Keep the default experience complete without client JavaScript. Client behavior may improve search, navigation continuity, copying, disclosure state, theme choice, or image inspection, but the content and ordinary links must still work when scripts fail.

Prefer CSS grid for page-level topology and flexbox for a single row or cluster. Give grid and flex children `min-width: 0`. Use logical properties where practical. Let one parent own each visible gap.

Reuse existing tokens and type roles. Do not solve an awkward composition with a private font size, random color, arbitrary shadow, or one-off margin. Repair the grouping, measure, or spacing owner.

### inspect and revise

Render the real route with the real content. Inspect the first viewport and the full page in light and dark themes. Inspect desktop, tablet, and narrow mobile. Exercise keyboard navigation, search, menus, disclosures, page actions, rail state, back and forward navigation, hash links, and reduced motion.

Review in this order:

1. **first read:** is the page's subject and main idea obvious?
2. **location:** can the reader tell which provider, chapter, and section they are in?
3. **language:** do headings and labels use Ani's voice and exact project vocabulary?
4. **composition:** does each section advance the explanation and use space intentionally?
5. **typography:** are roles, line length, baselines, line breaks, and vertical rhythm coherent?
6. **interaction:** are controls named by their outcome, complete by keyboard, and stable across client navigation?
7. **evidence:** are sources, captions, units, qualifiers, and media attached to the claims they support?
8. **restraint:** can a surface, border, icon, label, effect, or paragraph be removed without losing meaning or affordance?
9. **reflow:** does the design recompose cleanly at every required width and under text enlargement?
10. **performance:** did the change preserve static delivery, image budgets, navigation speed, and a quiet console?

Fix the highest-impact systemic issue, render again, and repeat until no known material design or usability defect remains.

## composition by surface

The site has several related surfaces. They share identity and primitives but do not need identical topology.

### homepage

The homepage is the cover and index.

- The opening title is the thesis. Its highlighted phrase is the single strongest graphic gesture on the page.
- The personal introduction explains why the handbook exists before presenting navigation.
- Provider guides and shared foundations form the primary starting structure.
- Provider groups may use equal columns only while their content is truly comparable.
- The page uses a centered publication measure with open rows and rules, not a product dashboard or card wall.
- The homepage should remain useful without a sidebar.

The highlight behind `coding agents` is earned because it names the site's central subject. Do not repeat that treatment on other phrases or pages. Preserve enough inline padding for descenders, cloned decoration across line fragments, and balanced line wrapping at responsive widths.

### provider guide pages

Guide routes are the reading shell.

- The global header identifies the site and active provider.
- The left guide rail owns provider identity, chapter navigation, and the current page outline.
- The article owns the title, updated date, page actions, reading content, and sources.
- The retired right rail stays absent. Do not recreate a second permanent navigation or evidence column.
- The article title and actions share one row where space allows.
- The current provider, chapter, and heading each have one active state. Avoid competing active markers.

Provider guides are coequal. Codex, Claude Code, and Grok use the same shell and chapter logic even when their content depth differs. Do not imply provider rank through column width, color intensity, icon size, or navigation prominence.

### shared guides, history, method, and field runs

Shared pages may use the same publication shell without pretending to be provider pages.

- History may use chronology because order changes understanding.
- Method and field runs may expose denser evidence because auditability is their job.
- Shared guides should keep a clear reading measure and source relationship.
- A table, timeline, or inventory may take more width than prose when its lookup task requires it.

Do not add a provider identity treatment to a general page merely to fill space.

### development-only review surfaces

The local copy-review workspace is an editorial tool, not a public design template.

- It may use denser panes, status counts, validation state, and publishing controls because its job is operational.
- Its rendered preview should reflect the public site faithfully.
- It stays loopback-only and excluded from production builds.
- Its control density and review states do not authorize similar density on public reading pages.

Public prose is edited in its canonical Markdown file and reviewed on the affected route in the normal Astro development server.

## authoritative visual system

### identity

The visual identity comes from a small set of repeated decisions:

- lowercase interface language;
- Instrument Sans for the publication voice;
- IBM Plex Mono for code and compact evidence metadata;
- cobalt for selection, action, links, and focus;
- white or near-black continuous canvases;
- open rows, aligned rules, and restrained radii;
- one global header and one unified guide rail;
- source-backed imagery and provider marks used as identification rather than decoration;
- stillness with short continuity motion where it helps orientation.

The signature is the combination of editorial typography and interface-level evidence. It should feel like a personal field manual whose implementation is as careful as its claims.

### shell

All public routes share one site header and one horizontal gutter system.

- Desktop and tablet header height: `4rem`.
- Narrow mobile header height: `6.65rem`, split into brand and provider rows.
- Horizontal gutter: `clamp(1rem, 2vw, 1.5rem)`.
- Header structure: site identity left, provider navigation centered, utilities right.
- Footer structure: site identity left, last-updated metadata centered, repository links right; compact into two rows on mobile.

The header and footer should feel related through height, alignment, type, and spacing. Borders mark real structural boundaries. Do not add repeated divider bands above or below them.

The homepage and guide pages share the shell but have different reading topology. The homepage centers its publication cover and index. Guide pages add the unified left rail.

### grid, width, and measure

The system uses a few stable measures rather than a universal twelve-column layout.

- Homepage content and guide index: `min(100% - 2rem, 76rem)`.
- Homepage title: up to `68rem`.
- Reading prose: normally `66ch`, with source orientation up to `68ch`.
- Starlight content: `48rem` before page-specific or framework constraints.
- Tablet guide content: centered within `52rem` while preserving the left rail.
- Desktop expanded guide rail: `15.5rem`, increasing to `17rem` at `80rem` and above.
- Desktop collapsed guide rail: `3.5rem`.

Use wider space for evidence that requires comparison or lookup. Tables, media groups, and aligned editorial rows may use the full article width. Do not widen ordinary prose simply because the viewport allows it.

Adjacent columns need unmistakable gutters. Wrapped text must never appear to continue into a neighboring column. When a split leaves one side underfilled, rebalance or stack it.

### typography

Typography is centralized in `src/styles/typography.css`. No other production Astro or CSS file may declare `font`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, or `text-transform`.

Use the implemented roles:

| role | token or value | use |
| --- | --- | --- |
| display | `clamp(2.75rem, 5vw, 4rem)` | homepage thesis only |
| page title | `clamp(2.25rem, 4vw, 3rem)` | one `h1` per page |
| major heading | `clamp(1.75rem, 2vw, 2rem)` | primary section turns |
| subheading | `1.375rem` | nested structure |
| body | `1.125rem` with `1.875rem` line height | public reading prose |
| dense | `1rem` with `1.5rem` line height | tables and compact evidence |
| navigation | `.875rem` with `1.25rem` line height | header, rail, and controls |
| metadata | `.75rem` with `1.125rem` line height | dates, labels, source counts, and operational identifiers |

Use Instrument Sans for headings, prose, navigation, labels, controls, and readable data. Use IBM Plex Mono for code, commands, paths, timestamps, compact evidence labels, and short operational identifiers. Do not set an entire sentence or table in Mono because it contains one identifier.

The normal weight range is 400 for reading and 600 for headings, current location, or strong emphasis. Emphasis is scarce. Large type uses slightly tighter tracking; body copy keeps normal tracking.

Build vertical rhythm from relationships:

- page title to introduction: close enough to read as one opening;
- heading to first paragraph: close;
- paragraph to paragraph or list: one body rhythm;
- content group to new major section: clearly larger;
- caption to its evidence: close;
- source disclosure to the article: enough separation to mark the audit path without detaching it.

Inspect line breaks in display and title text. Fix an awkward measure or copy choice before shrinking an individual heading. Never use tiny muted text to make a layout fit.

### color

The palette is semantic and theme paired.

| role | light | dark | purpose |
| --- | --- | --- | --- |
| canvas | `#ffffff` | `#0b0c0f` | continuous page background |
| raised surface | `#ffffff` | `#12141a` | menus, search, controls, and bounded overlays |
| subtle surface | `#f4f5f7` | `#181b22` | hover, code, table heads, and quiet grouping |
| primary text | `#101114` | `#f5f7fb` | headings and body |
| muted text | `#505760` | `#a7adb7` | secondary navigation and metadata |
| border | `#c9cdd3` | `#303541` | structural boundaries |
| primary accent | `#1247e6` | `#5279f2` | active state, links, focus, and actions |
| soft accent | `#e9efff` | `#18254f` | selected or focused background |
| strong accent | `#0a2c91` | `#c1ccff` | accent text requiring stronger contrast |
| warning | `#e52b1a` | `#ff776b` | actionable warning state only |

Use cobalt when it communicates action, current location, link affordance, or focus. Do not use it to make ordinary prose more exciting. Warning red communicates a real review or failure state. It does not decorate counts or call attention to neutral metadata.

Every semantic color must work in both themes. Pair state color with text, position, icon, underline, or another non-color cue.

Do not add gradients, gradient text, glows, blobs, glass, paper texture, colored rails, or ornamental shadows. A shadow is reserved for a floating overlay whose elevation needs to be understood: search, menus, image dialogs, link previews, or the mobile menu.

### surfaces, borders, and radii

The public site is one continuous canvas. Earn a surface or boundary through grouping, state, or interaction.

- `--radius-sm: .25rem` for compact controls and icon frames.
- `--radius-md: .5rem` for menus, search, actions, and dialogs.
- `--radius-pill` only for true circular or capsule behavior such as status counts or round controls.
- Rules separate rows, columns, header boundaries, and evidence groups.
- Open space and typography should establish hierarchy before a box does.

Do not wrap every section, recommendation, metric, or source in a card. Avoid nested panels. Do not use borders to repair unclear hierarchy.

### navigation

Global provider navigation and guide chapter navigation answer different questions.

- Provider tabs answer: which agent family am I reading?
- Guide chapters answer: which part of that provider handbook am I reading?
- The nested page outline answers: which section of this page am I reading?

Keep one visible active state for each layer. The active provider uses a cobalt filled field. The active guide row and active heading use quieter accent treatment so they support rather than compete with the global state.

The guide rail is conventional documentation navigation made specific through provider identity, lowercase labels, compact chapter icons, and a nested live outline. It is not a decorative progress timeline.

The rail may collapse at desktop widths. The collapsed state keeps chapter icons, accessible labels, tooltips, and the active chapter. It hides the page outline because isolated nested headings would lose context.

At widths below `48rem`, remove the permanent rail and use the shared mobile menu. Do not squeeze the desktop rail into the article or add a second horizontal chapter bar.

### icons and provider identity

Icons help the reader identify an established product, chapter, action, or state.

- Use the existing Phosphor icon family through `astro-icon`.
- Use verified provider product marks from `src/site.ts` and `docs/sources.json`.
- Preserve the provider mark's source URL and checked date.
- Provider marks identify a product or official source. They do not imply endorsement or rank.
- Use a consistent optical size and frame treatment within one context.
- Keep decorative icons out of prose, headings, cards, and metadata.
- Prefer a text label when the icon would require explanation.

Do not draw provider logos by approximation, synthesize decorative product marks, or use a logo merely to fill an empty area.

### links and sources

Link treatment communicates destination and evidence status.

- Public article links use cobalt and reveal an underline on hover or focus.
- Navigation links use location and hover states rather than body-link styling.
- Official provider sources may use a verified provider icon or source preview when that improves destination recognition.
- External destinations expose an external cue where context needs it.
- Source disclosures group records by publisher and preserve publisher identity, domain, title, and exact URL.
- A source treatment must never imply that a personal analysis is an official provider claim.

Use the registered source metadata. Do not guess official status from a domain at render time. Do not add elaborate hover cards that obscure reading or introduce a new network dependency.

### tables and aligned evidence

Tables are for exact lookup.

- Use a semantic table with column headers and row headers where appropriate.
- Align text columns left and numeric columns right, including their headers.
- Keep units, precision, periods, and comparison bases consistent.
- Give row-label columns enough width for ordinary labels.
- Body cells align to the first text baseline.
- Use normal density for ordinary tables and local horizontal scrolling when a genuine wide lookup cannot reflow.
- Keep the explanation above the table rather than stranding it in a narrow neighboring rail.

Aligned editorial rows are appropriate when each item has the same conceptual fields but the reader does not need column sorting or dense lookup. Unequal findings should not be forced into equal cells.

### code and technical identifiers

Code is evidence or reusable syntax.

- Use IBM Plex Mono.
- Keep inline code close to the reading size.
- Use a dark code field with sufficient contrast in both themes.
- Preserve copy behavior, language labels, wrapping, and horizontal scrolling.
- Do not place commands inside decorative terminal chrome.
- Do not simulate typing or terminal activity.

### media

Use screenshots, diagrams, provider marks, and artifacts only when they establish product behavior, interface context, chronology, or evidence.

- Preserve source attribution and descriptive alt text.
- Use local responsive WebP derivatives registered in the media manifest.
- Provide intrinsic dimensions, accurate `srcset` and `sizes`, asynchronous decoding, and deliberate loading priority.
- Keep captions attached to the image they qualify.
- Use image enlargement only when the original detail matters.
- Reuse a derivative when the same source image appears more than once.

Do not add stock imagery, decorative AI illustrations, fake product screenshots, ambient hero art, or media that repeats the adjacent prose.

### motion

Default to stillness.

The implemented motion system uses `160ms` and `cubic-bezier(.2, .75, .25, 1)` for interface continuity. Use it for active provider movement, rail state, menus, disclosures, hover confirmation, and other small state changes.

Client page swaps are immediate. Do not add crossfades, page reveal sequences, parallax, scroll-triggered entrances, animated gradients, simulated typing, pulsing status, or motion that delays reading.

Respect `prefers-reduced-motion`. The content, location, and interaction outcome must remain complete when motion is removed.

### themes

Light and dark themes are coequal. The theme control preserves system preference until the reader chooses a fixed theme.

- Test hierarchy, borders, focus, links, code, images, icons, overlays, and selected states in both themes.
- Do not solve dark mode by reducing all contrast.
- Do not add theme-specific layout or content.
- Use semantic tokens rather than hard-coded theme selectors whenever possible.
- A provider asset may use an explicit light and dark pair when the official mark requires it.

## responsive contracts

Responsive design is recomposition, not shrinking.

| range | required behavior |
| --- | --- |
| below `48rem` | two-row `6.65rem` header, centered provider tabs, compact utility cluster, no permanent guide rail, one-column provider index, locally scrolling wide tables, compact footer |
| `48rem` through `71.99rem` | `4rem` header, visible `15.5rem` guide rail, centered article within `52rem`, compact search where required, no right rail |
| `72rem` through `79.99rem` | full publication shell with the same guide rail and wider article breathing room |
| `80rem` and above | expanded guide rail may grow to `17rem`; article keeps a deliberate left relationship rather than stretching prose |

Required viewport checks include `320`, `375`, `768`, `942`, `1024`, `1191`, and `1440` pixels. The automated suite adds nearby boundary widths to catch breakpoint flashes and off-by-one behavior.

At every width:

- no page-level horizontal overflow;
- no overlap between brand, navigation, utilities, title, and actions;
- provider tabs remain centered and reachable;
- the active provider and chapter remain clear;
- interactive targets remain usable by touch and keyboard;
- body copy remains at a readable size and measure;
- tables preserve lookup through reflow or local scrolling;
- overlays fit the dynamic viewport and safe-area insets;
- mobile source and navigation disclosures do not delay the article's first useful content.

Test at 200 percent text zoom and with WCAG text-spacing overrides. A design that works only at default font metrics is incomplete.

## interaction contracts

Controls use plain verbs and stable vocabulary. The label names the outcome: `copy page`, `view Markdown`, `edit on GitHub`, `search`, `switch to dark mode`.

An action keeps the same name through confirmation and failure. Status is announced through an appropriate live region without replacing visible context.

Use native links, buttons, details, dialog, lists, and tables. Preserve source order as reading order. Menus and dialogs close with Escape and restore a useful focus target. Outside clicks may dismiss a transient surface without making keyboard dismissal impossible.

Client navigation must preserve:

- ordinary URLs and no-script fallback;
- route announcements and focus handling;
- back and forward navigation;
- hash links and scroll restoration;
- active provider, chapter, and outline state;
- mobile menu closure;
- theme and rail preferences;
- external-link behavior.

Do not persist header or guide DOM when doing so can retain stale active states. Re-initialize page-owned listeners on `astro:page-load` and tear down prior listeners with `AbortController` or an equivalent explicit lifecycle.

### state and failure

Empty, loading, and failure states give direction.

- Name what is unavailable.
- Explain the next action when one exists.
- Preserve the last valid result when an interaction can recover.
- Do not apologize, joke, or use mood copy.
- Do not present a successful visual state before the operation is verified.

Development-only publishing state must distinguish local draft, validated, signed commit, pushed branch, pull request, merged, and deployed. One state never implies the next.

## content is design material

Words establish hierarchy, pace, and trust. Follow `AGENTS.md` for public voice and canonical ownership.

- Ani's manual rewrites and annotations are the primary voice reference.
- Keep public interface language lowercase.
- Prefer concrete experience, recognizable details, and direct explanation.
- Preserve honest uncertainty and the difference between official fact, tested behavior, analysis, and open question.
- Keep labels short and literal.
- Remove repeated context unless repetition changes understanding or creates a deliberate editorial rhythm.
- Do not write generic authority claims, product hype, fan language, or textbook filler.
- Do not use mid-dot dividers, litotes, negative comparison frames, or decorative overlines.
- Do not use hyphens in normal public prose except where syntax, routes, commands, versions, URLs, filenames, or official product names require them.

Design around approved text. Do not normalize casing, punctuation, contractions, or sentence rhythm to make a component easier to reuse.

## accessibility

Accessibility is a design requirement and release contract.

- One descriptive `h1` per page and ordered heading levels.
- A skip link and correct header, navigation, main, aside, and footer landmarks.
- Visible keyboard focus with at least a `3px` cobalt outline where the component does not provide an equivalent inset state.
- Native controls and semantic tables.
- Accessible names for icon-only controls.
- Current location exposed with `aria-current` at the appropriate navigation layer.
- Dialog focus, Escape handling, and background isolation.
- Meaningful alt text for evidence-bearing media and empty alt text for redundant marks.
- Captions and text alternatives for material visual evidence.
- WCAG AA contrast in light and dark themes.
- No information communicated by color alone.
- Reflow at narrow widths, 200 percent resize, and text-spacing overrides.
- Touch targets large enough to operate without distorting the compact visual rhythm.

Do not hide document overflow globally to conceal a broken component. Repair the component or give the genuinely wide object a local scrolling region.

## performance and delivery

Performance is part of the design because delay changes the reading experience.

- Keep static-rendered HTML and ordinary URLs.
- Use the existing Astro `ClientRouter` for immediate internal navigation with progressive enhancement.
- Keep page swaps free of decorative transition delay.
- Do not add a client framework, service worker, global hydration, icon kit, chart library, analytics dependency, or third-party runtime for a visual refinement.
- Prefer CSS and semantic HTML for presentational behavior.
- Keep fonts within the established file and byte budgets.
- Keep guide HTML and shared CSS within the established compressed budgets.
- Keep individual publication derivatives at or below `150 KiB` and each provider overview's mobile image payload below `400 KiB`.
- Load only a measured image LCP candidate eagerly and at high priority. Keep later media lazy.
- Avoid eager prefetching of every page or image.
- Keep the console free of errors and actionable warnings.

Do not trade a small visual flourish for route latency, layout shift, input delay, or another failure mode.

## CSS and component discipline

The cascade has an intentional order:

1. `site.tokens`
2. `site.typography`
3. `site.shell`
4. `site.publication`
5. `site.navigation`
6. `site.overrides`

Put a rule in the narrowest layer that owns its meaning.

- Tokens define semantic values, never component selectors.
- Typography owns all project typography declarations.
- Shell owns cross-route identity, header, footer, homepage, search, and mobile shell.
- Publication owns article reading, evidence, page actions, tables, media, and Starlight integration.
- Navigation owns the unified guide rail and responsive guide behavior.
- Component-local styles are acceptable for a component's unique internal structure when they use shared tokens and do not redefine a global role.

Prefer low-specificity class selectors. Avoid element selectors tied to framework internals unless the Starlight integration requires them and a regression test protects them. Do not use `!important` except at the framework boundary where an existing Starlight layout contract must be overridden deliberately.

Every new selector should answer:

- what semantic object does this name?
- which layer owns it?
- which token expresses its state?
- what happens in dark theme?
- what happens below `48rem`?
- what happens with reduced motion?
- what test or visual receipt protects it?

## stable token interface

Use the semantic tokens already exposed in `src/styles/tokens.css`.

### surfaces and text

`--surface-canvas`, `--surface-raised`, `--surface-subtle`, `--text-primary`, `--text-muted`

The legacy aliases `--white`, `--ink`, `--soft`, and `--slate` remain part of the current implementation. Prefer the semantic names when introducing a new cross-system rule. Do not remove an alias without migrating all consumers and verifying generated output.

### action and state

`--accent-primary`, `--accent-soft`, `--accent-strong`, `--accent-on-solid`, `--status-warning`

The current aliases are `--cobalt` and `--warning`.

### boundary and shape

`--border-default`, `--rule`, `--radius-sm`, `--radius-md`, `--radius-pill`, `--radius-ui`

### motion and depth

`--motion-ui-duration`, `--motion-ui-ease`, `--z-navigation`, `--z-menu`, `--z-preview`, `--z-emergency`

### shell geometry

`--site-header-height`, `--site-gutter`, `--rail-expanded-width`, `--rail-collapsed-width`, `--left-rail-width`, `--right-rail-width`

### type

`--font-sans`, `--font-mono`, `--type-display-size`, `--type-title-size`, `--type-heading-size`, `--type-subheading-size`, `--type-body-size`, `--type-dense-size`, `--type-navigation-size`, `--type-metadata-size`, and their line-height partners.

Do not invent near-duplicate tokens such as `--blue`, `--panel-gray`, `--small-radius`, or `--fast-transition`. Add a token only when the new value has a stable semantic role across more than one component or state.

## reject generated-design reflexes

Do not ship these defaults:

- a generic centered hero followed by a card grid;
- repeated cards for ordinary prose, recommendations, sources, or navigation;
- all-caps tracked eyebrows, numbered section ornaments, and redundant route labels;
- gradients, glows, blobs, glass, textures, paper simulations, and fake depth;
- oversized provider logos or icons in colored tiles;
- decorative terminal windows and simulated typing;
- a permanent right rail without a distinct reader task;
- arbitrary icon styles or icons that duplicate a visible label;
- pills for ordinary metadata;
- tiny gray prose used to increase density;
- arbitrary type sizes or weights outside `typography.css`;
- equal columns for materially unequal information;
- wide prose and narrow tables inside the same section;
- nested panels, cards inside cards, and borders around every group;
- chart-like bars that do not encode a shared scale;
- repeated summary, recommendation, and conclusion sections that make the same claim;
- decorative motion, route crossfades, parallax, scroll reveals, bounce, or pulsing status;
- copied Vercel layouts, Geist typography, triangle marks, black-and-white branding, or `vbg-*` primitives;
- copied provider product UI used as the site's own interface language;
- content generated to fill an underdesigned area.

Restraint must not flatten the site. When a page feels weak, strengthen the focal relationship through hierarchy, proportion, line breaks, density, or evidence placement. Keep supporting material quieter. Do not add effects to compensate for an unclear argument.

## change protocol

Begin every material design change read-only.

1. Verify the active worktree, branch, base SHA, uncommitted files, preview owner, and task ownership.
2. Read the canonical Markdown and the nearest design, component, decision, and test owners.
3. Capture the current route at the target viewport and state.
4. Define the reader problem and the smallest system-level change that resolves it.
5. Implement in the owning file without changing public wording unless Ani requested that exact copy change.
6. Compare before and after at matching viewport, theme, scroll position, and UI state.
7. Run the focused checks while iterating, then the full required suite before publication.
8. Record non-obvious visual decisions or accepted differences in `.github/qa/` or `docs/decisions/`.
9. Keep design, content, and performance ownership separate when parallel work is active.
10. Report local, committed, pushed, pull request, merged, and deployed states separately.

A screenshot is evidence only when its route, viewport, theme, scroll position, branch, and source SHA are known. A passing test does not replace visual inspection. A local preview does not prove production.

## verification

Use the package scripts. A broad design change must pass:

```sh
bun run check
bun run check:field-runs
bun run check:readme
bun run check:content
bun run build
bun run test:site
bun run test:navigation
bun run test:a11y
bun run check:performance
```

Run `bun test plugins/cc/tests` and `pytest plugins/lore/tests` when archive or shared runtime surfaces change, and during scheduled full verification.

The visual QA matrix covers all canonical routes at the established responsive widths. At minimum, inspect:

- homepage;
- one shared guide;
- Codex overview and a nested chapter;
- Claude Code overview and a nested chapter;
- Grok overview;
- history or method when chronology or dense evidence changes;
- light and dark themes;
- expanded and collapsed desktop rail;
- narrow mobile menu, search, tables, actions, disclosures, and footer;
- keyboard focus, Escape, back and forward, hash links, and scroll restoration;
- 200 percent resize and text-spacing overrides;
- browser console, layout shift, and horizontal overflow.

When a change affects the first provider image, client navigation, fonts, shared CSS, or route HTML, rerun the performance audit and compare measured behavior rather than assuming the budget check is sufficient.

## definition of done

A design change is complete when:

- it solves a named reader problem;
- it uses the existing design authority or deliberately updates that authority;
- it preserves Ani's approved wording and source distinctions;
- the first read and study path both work;
- the active provider, chapter, and section remain clear;
- the design is coherent in light and dark themes;
- it reflows without overflow at all required widths and text settings;
- keyboard, screen-reader, reduced-motion, and no-script behavior remain sound;
- it introduces no unnecessary runtime, dependency, remote asset, or visual effect;
- focused and broad checks pass;
- the actual rendered result has been inspected;
- local, provider, merged, and deployed states are reported separately.

The final test is simple: the page should feel more like coding agent tips after the change. It should be clearer, more personal, more useful, and more technically credible without looking busier or more manufactured.
