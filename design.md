---
name: coding-agent-tips-design
description: Authoritative visual, interaction, responsive, media, and progressive agent-native design standards for coding agent tips.
---

# design coding agent tips

This document is the design authority for the public site. It turns the site's editorial values into concrete composition, component, interaction, media, accessibility, and delivery rules.

The aim is a professional publication that feels personal, current, and technically credible. The interface should make the handbook easy to read and verify. It should not become a product demo, an ornamental design exercise, or a copy of any provider's interface.

## subject, audience, and job

Coding agent tips is an opinionated, source backed handbook about using coding agents in real work.

Its primary readers are experienced builders, staff engineers, hiring managers, and technically serious newcomers who may land on one page without prior context. A page must support two reading modes:

1. A first pass that establishes the subject, the recommendation, and why it matters.
2. A study pass that exposes structure, evidence, sources, technical detail, and open questions.

The design helps a reader answer four questions quickly:

- where am I in the handbook?
- what is the main idea on this page?
- what can I do next?
- which claims come from use, official sources, analysis, or an open question?

## use this priority order

When requirements compete, use this order:

1. Preserve Ani's approved wording, browser annotations, factual qualifiers, source distinctions, and compatibility promises.
2. Preserve canonical Markdown, ordinary URLs, static output, and progressive Astro and Starlight behavior.
3. Make location, hierarchy, action, and the main idea immediately legible.
4. Protect semantics, keyboard use, readable contrast, reflow, and theme parity.
5. Preserve the established identity: Instrument Sans, IBM Plex Mono, cobalt action color, open publication geometry, and restrained surfaces.
6. Fit the composition to the content instead of forcing content into a decorative template.
7. Add motion, density, and detail only when they improve continuity or comprehension.

Never silently rewrite public copy to make a component fit. Change the composition first. If accuracy, safety, or accessibility requires a wording change, explain the conflict and edit the canonical Markdown deliberately.

## authority and source ownership

One concern has one authoritative owner.

| concern | authority |
| --- | --- |
| public visual, interaction, responsive, media presentation, and agent-native design standards | `design.md` |
| homepage prose | `content/home.md` |
| shared handbook prose | `content/handbook/*.md` |
| provider overview and chapter prose | `content/guides/<product>*.md` |
| frozen compatibility prose | `content/archive/*.md` |
| source metadata, current versions, and evidence definitions | `editorial/sources.json` |
| planned handbook structure | `editorial/handbook-blueprints.json` |
| page-level editorial review state | `editorial/review-ledger.md` |
| shared navigation and interface copy | `src/site.ts` |
| content schema and allowed editorial metadata | `src/content.config.ts` |
| publication media inventory and optimized derivatives | `public/media/publications/manifest.json` and `public/media/**` |
| semantic design tokens | `src/styles/tokens.css` and `src/styles/starwind.css` |
| type roles | `src/styles/typography.css` |
| shell, publication, and guide navigation implementation | the corresponding files in `src/styles/` and `src/components/` |
| generated route behavior and verification | `astro.config.mjs`, `src/integrations/`, and `scripts/` |

Components render canonical data. They do not own guide summaries, product explanations, recommendations, version claims, or source records.

Starwind owns interactive component anatomy and behavior. Starlight owns documentation rendering and search. Site wrappers may choose documented variants, sizes, labels, and placement. They may not fork upstream interaction logic merely to obtain a different visual treatment.

## work in five passes

### frame the reader's job

Before changing the interface, name the reader problem in one sentence. Examples include finding the next chapter, distinguishing evidence from commentary, comparing surfaces, or seeing an image at sufficient detail.

Define success as an observable reading or interaction outcome. "Make it modern" is not a reader outcome.

### map the information hierarchy

Identify the page title, opening claim, major section turns, nested headings, evidence, source path, next action, and supporting metadata. Remove repeated labels that restate the route, title, or surrounding section.

### choose the composition

Use typography, measure, spacing, alignment, and order before adding a surface. Reserve tables for lookup, media groups for comparisons, and overlays for temporary detail.

### implement through the system

Use the existing tokens, Starwind components, Starlight integration, content schema, and route data. Add a new component, token, controller, or dependency only when an existing owner cannot express the required behavior.

### inspect and revise

Compare matching routes, viewport sizes, themes, scroll positions, focus states, and motion preferences. A passing test protects known contracts; it does not replace inspection of the rendered result.

## composition by surface

### homepage

The homepage introduces one clear thesis and routes the reader into the handbook. Its hierarchy comes from a strong opening, compact guide groups, and direct shared-guide links.

Keep the first screen legible without decorative hero art. Use open rows and restrained cards only where a group needs a boundary. Provider groups may share a grid because they have the same conceptual structure. Shared guides remain a simple publication list.

### provider guide pages

A provider page opens with its title, update state, page actions, and first useful claim. The guide rail provides chapter navigation; the active page may reveal a compact indented heading outline.

Do not add a permanent right table of contents or a second intermediate navigation bar. The article remains the visual center. Media can become wider than prose when comparison or interface detail needs it.

### shared handbook pages

Shared pages use the same publication shell without pretending to belong to a provider. Chronology, comparisons, and methods may use timelines, tables, or aligned evidence rows when those structures improve retrieval.

### editorial review

Review happens in canonical Markdown and the normal Astro preview. The retired copy-review application is not part of the system.

The current schema has three separate axes:

- `status`: `current`, `pending`, or `archive` describes publication currency.
- `completion`: `outline`, `excerpt`, or `complete` describes how much of the intended page is written.
- `evidence`: `tested`, `official-source`, `analysis`, or `open-question` describes the claim basis.

These values do not substitute for one another. A complete page can still contain open questions. A current page can need source rechecking. Green CI means the checked tree passed its checks; it does not by itself mean the wording was approved, published, or verified in production.

The editorial ledger uses these review states:

1. **unreviewed**: Ani has not yet reviewed the page's current wording and structure.
2. **in progress**: editing, annotation, or review is actively underway.
3. **Ani reviewed**: Ani has reviewed the recorded wording and structure represented by the ledger entry.
4. **ready**: the page has satisfied the content and source conditions recorded by the editorial lane and is ready for integration.

Review state and delivery state are separate. Report local, committed, pushed, pull request, merged, deployed, and live states independently. Never infer a delivery state from a review state or a later state from an earlier one.

## authoritative visual system

### identity

The visual language is editorial and technical:

- lowercase interface language;
- Instrument Sans for reading and navigation;
- IBM Plex Mono for code and operational metadata;
- cobalt for action, focus, links, and current location;
- white or near-black continuous canvases;
- compact controls, open rows, and structural rules;
- verified provider marks and source backed media;
- short motion used only for continuity.

Do not copy provider product chrome. Provider marks identify subject matter and source; they do not define the site's component language or imply endorsement.

### shell geometry

The site header has two intentional compositions:

| viewport | header contract |
| --- | --- |
| `60rem` and wider | one row, exactly `64px` high |
| below `60rem` | two rows, exactly `92px` high |

The second row keeps all four provider tabs centered, horizontally reachable, and visually compact. It is not a substitute for guide navigation.

The guide shell has two modes:

| viewport | guide navigation contract |
| --- | --- |
| below `48rem` | no permanent rail; use the shared mobile Sheet |
| `48rem` and wider | persistent Starwind sidebar with expanded and icon-collapsed states |

The expanded rail is `17rem`. The collapsed rail is `3.5rem`. The collapsed state centers the trigger and chapter icons within equal horizontal and vertical space. It hides nested headings whose parent label would otherwise be absent.

The reading progress indicator may appear from `64rem` upward when a guide rail exists. It belongs to the main canvas boundary, is never independently scrollable, and communicates progress without becoming a second navigation system.

Ordinary prose uses a deliberate reading measure. Tables, screenshots, and comparison media may use the wider article measure. Do not widen prose just because the viewport permits it.

### typography

Typography is centralized in `src/styles/typography.css`. Production component and layout styles should not invent local font families, arbitrary type sizes, weights, line heights, tracking, or transformations.

Use the established roles:

| role | use |
| --- | --- |
| display | homepage thesis only |
| page title | the single page `h1` |
| major heading | primary section turns |
| subheading | nested document structure |
| body | public reading prose |
| dense | tables and compact evidence |
| navigation | header, rail, and controls |
| metadata | dates, labels, source counts, and operational identifiers |

Compact interface text uses the copy page control as its baseline: `12px` type,
`16px` line height, `32px` control height, and `16px` action icons. Outline rows
use `18px` line height for scanning. Keep document headings, prose, tables, and
code in their reading roles. Portaled menus and tooltips must retain the same
interface typography as their triggers, with no inherited prose underlines.

Search expands in the header at the existing control height. On small screens,
the brand mark remains at the left and the input uses the space before the theme
and menu buttons. Only results extend below the row; the page remains visible.
Use a restrained neutral input border and preserve keyboard focus and Escape.
Page action menus close through Starwind when the document scrolls; scrolling
inside an overlay does not dismiss it.

Use IBM Plex Mono for code, commands, paths, timestamps, and short operational identifiers. Do not set a sentence or table in Mono because it contains one identifier.

Build vertical rhythm from relationships. Keep a heading close to its first paragraph, a caption close to its evidence, and a new major section visibly separate from the preceding group. Fix measure and composition before shrinking text.

### color and themes

Use semantic tokens rather than hard-coded component colors. The canonical paired roles are:

| role | light | dark | purpose |
| --- | --- | --- | --- |
| canvas | `#ffffff` | `#0b0c0f` | continuous page background |
| raised surface | `#ffffff` | `#12141a` | overlays and bounded controls |
| subtle surface | `#f4f5f7` | `#181b22` | hover, code, and quiet grouping |
| primary text | `#101114` | `#f5f7fb` | headings and body |
| muted text | `#505760` | `#a7adb7` | secondary navigation and metadata |
| border | `#c9cdd3` | `#303541` | structural boundaries |
| primary accent | `#1247e6` | `#5279f2` | actions, links, focus, and current location |
| soft accent | `#e9efff` | `#18254f` | selected and focused backgrounds |
| strong accent | `#0a2c91` | `#c1ccff` | accent text requiring stronger contrast |
| warning | `#e52b1a` | `#ff776b` | actionable warning or failure |

Light and dark themes are coequal. A component's background, foreground, border, icon, focus, hover, active, disabled, and overlay states must all use the same semantic family. Never mix light-theme border or keycap colors into a dark control.

Cobalt communicates action, location, links, or focus. Warning red identifies a real warning or failure. Pair color with text, position, icon, underline, or another non-color cue.

Do not add gradients, glows, blobs, glass, textures, ornamental shadows, or theme-specific layouts. Shadows are reserved for floating overlays whose elevation must be understood.

### surfaces, borders, and radii

The public site is one continuous canvas. Earn a surface through grouping, state, or interaction.

- `--radius-sm` is for compact controls and icon frames.
- `--radius-md` is for menus, search, actions, and dialogs.
- `--radius-pill` is for truly circular or capsule behavior.
- Rules separate rows, columns, header boundaries, and evidence groups.
- Open space and typography establish hierarchy before a box does.

Do not wrap ordinary prose, recommendations, sources, or every navigation item in cards. Avoid nested panels and borders used to repair weak hierarchy.

### navigation

The three navigation layers answer different questions:

- provider tabs: which agent family am I reading?
- guide chapters: which part of this provider handbook am I reading?
- active page outline: which section of this page am I reading?

Keep one visible current state per layer. The provider state may use a filled cobalt field. Guide and outline states remain quieter. Indentation, spacing, typography, and icons establish hierarchy; decorative bullets, connector lines, and timeline marks do not appear in the guide rail.

Expanded rail rows use compact, conventional documentation sizing. Hover and focus states have visible inset space and must not make text jump into alignment with a different hierarchy level. The active state uses background, type, and `aria-current`, not a single exposed border accent.

The desktop rail may collapse to icons with accessible names and tooltips. On mobile, Starwind Sheet contains the same route data, closes on navigation and Escape, traps focus while open, and restores focus to its trigger.

### icons and provider identity

Use Tabler icons supplied by the Starwind setup for interface actions. Use the verified provider product marks configured by the site. Keep optical size consistent within a control group, including search, theme, GitHub, page actions, menu, and sidebar triggers.

An icon supplements a known action or identity. Prefer text when the symbol would require explanation. Keep decorative icons out of prose and metadata. Never approximate provider logos or use a mark to fill empty space.

### links and sources

Article links use cobalt and reveal an underline on hover or focus. Navigation uses location states rather than body-link styling. External destinations expose their destination when context requires it.

Source presentation preserves publisher, title, URL, evidence kind, and the distinction between an official claim and personal analysis. Use registered metadata; do not guess official status from a hostname at render time.

Hover cards are supplementary. The underlying anchor remains complete, focusable, and usable with JavaScript disabled, touch input, blocked scripts, or an unavailable preview.

### tables and code

Tables are for exact lookup. Use semantic headers, left-align text, right-align numbers and their headers, keep units consistent, and align cells to the first text baseline. A genuinely wide table gets a local Starwind ScrollArea; document overflow remains intact.

Code is evidence or reusable syntax. Use IBM Plex Mono, preserve language labeling and local scrolling, and expose a compact copy button with visible focus and toast feedback. Do not add decorative terminal chrome, simulated typing, or animation.

## media and attribution

Media must establish product behavior, interface context, chronology, comparison, or evidence. Remove media that fills space or repeats adjacent prose.

### ownership and storage

Classify media before adding it:

- **Ani owned**: Ani created or supplied it. It may be stored locally, optimized, and served through responsive derivatives. Preserve provenance in the media manifest.
- **licensed or explicitly permitted third party**: local storage is allowed only within the documented license or permission. Record the original URL, source page, permission basis, and derivative inventory.
- **unlicensed third party**: do not rehost it. For X content, default to the official lazy embed or a credited link to the original post. For other sources, prefer the original page or an official embed.

Never turn technical ability to download an asset into permission to republish it.

### credit

Credited third-party media shows:

- the creator's display name;
- the creator's `@handle` when one exists;
- a link to the original post or canonical source;
- a natural, specific shoutout explaining why the work is useful here.

Creator identity and the original-post link remain adjacent to the media in the inline publication layout. The expanded view may repeat that credit for context, but it cannot be the only place the credit appears. Credit never implies sponsorship, endorsement, partnership, affiliation, or permission beyond what is documented.

### images, captions, and enlargement

Provide intrinsic dimensions, responsive sources where useful, asynchronous decoding, and a truthful loading priority. Load only a measured first-view candidate eagerly; later images are lazy.

An image opens in a Starwind Dialog only when the larger view reveals useful detail. The trigger is a button with an accessible action name. Escape closes the dialog, focus is contained and restored, and the original page remains usable without the enhancement.

Captions are hidden in the inline publication layout by default for dialog-enabled images. The complete caption appears with the enlarged image. If a caption contains essential information that the reader needs without opening the image, move that information into nearby prose instead of relying on the hidden caption.

A caption explains relevance, provenance, or credit. It does not repeat the alt text.

### alt text

Alt text describes the information the image contributes in its current context:

- describe the relevant interface, relationship, or outcome;
- include visible text only when that text matters to the point;
- omit phrases such as "image of";
- use `alt=""` for decorative or fully redundant images;
- keep creator credit and source attribution outside the alt text;
- for a linked image, ensure the combined accessible name communicates the destination or action.

When an image is too information dense for useful alt text, provide the concise point in prose and make the larger view available.

### third-party embeds and graceful fallback

Third-party embeds load lazily and never block the first useful article content. Reserve their aspect ratio to prevent layout shift. Do not autoplay media. Avoid loading tracking-heavy embed runtimes before the reader approaches or requests the content.

Every embed includes an ordinary link to the original post or source. If the runtime is blocked, the post is deleted, the network is unavailable, or JavaScript is disabled, the reader still sees the creator identity, a useful description, and the source link. The surrounding argument cannot depend on the embed remaining available.

## interaction contracts

Use plain, stable verbs: `search`, `copy page`, `copy link`, `view Markdown`, `edit on GitHub`, `open menu`, and `switch to dark mode`.

An action keeps the same name through success and failure. Toasts announce outcomes without replacing visible context. Do not show success before the underlying operation completes.

Use native links and document semantics. Use Starwind for menus, Sheet, Dialog, Accordion, HoverCard, Tooltip, Toast, ScrollArea, Progress, and grouped buttons. Escape closes transient UI and focus returns to a useful origin.

Client navigation must preserve:

- ordinary URLs and no-script fallback;
- route announcements and focus handling;
- back, forward, hash navigation, and scroll restoration;
- active provider, chapter, and outline state;
- mobile Sheet closure;
- theme and sidebar preference;
- search and external-link behavior.

Initialize page-owned controllers on `astro:page-load` and explicitly destroy prior listeners or Starwind instances. Do not persist DOM that can carry stale route state.

### search in development and production

Search is a core route behavior, not a production-only convenience. Starlight and Pagefind own its index and result UI.

`bun run dev` first builds the static output so a current Pagefind index exists. `src/integrations/starlight-dev-search.mjs` serves that generated index through the Astro development server. Local search must open from the visible header control, accept a query without icon overlap, return current guide results, support keyboard and Escape behavior, and remain free of console errors.

Do not add a separate local search implementation, hard-coded mock results, or a custom command palette. `bun run test:dev-search` is the focused contract; `bun run verify` must continue to include it.

SiteHeader supplies an accessible input name because the installed Pagefind UI
exposes only a title label. This adapter disconnects after labeling the input and
on route swaps; it owns no search, menu, focus, or keyboard state.

### invisible progressive agent-native behavior

Agent-native behavior is progressive infrastructure, not visible chrome. The human page remains complete without an agent, WebMCP support, or JavaScript.

Any future WebMCP integration must follow these rules:

1. **Feature detect** support. Never render a blank placeholder, disabled agent button, or agent-only instruction when unavailable.
2. **Expose stable semantic operations**, not DOM coordinates or styling details. Candidate read operations include discovering canonical page metadata, searching the handbook, retrieving section structure, and resolving registered sources.
3. **Preserve ordinary fallbacks**. Every navigational result has a canonical URL; every source has a normal link; every human action remains available through the visible interface.
4. **Keep authority explicit**. Reading and navigation may be exposed as read-only capabilities. Clipboard, editing, outbound communication, publication, account changes, or any external mutation require the same user-visible authority and confirmation as the human path.
5. **Return structured provenance and failure**. Results identify the canonical route, content update time, evidence status, and relevant source IDs. Unsupported, unavailable, stale, and unauthorized are distinct outcomes.
6. **Version the contract**. Capability names and payload schemas remain independent of component classes and may change only with a documented compatibility decision.
7. **Protect privacy and performance**. Do not send page content, queries, or reading activity to a third party merely because an agent capability exists. Do not add a global runtime to advertise it.

This document defines the future contract. It does not authorize implementing WebMCP in an unrelated design change.

## motion and reduced motion

Default to stillness. The interface continuity token is `160ms` with `cubic-bezier(.2, .75, .25, 1)`.

Use motion to preserve spatial understanding when provider state moves, a sidebar changes width, a disclosure opens, or a menu appears. Client route swaps remain immediate. Do not add page crossfades, scroll reveals, parallax, simulated typing, pulsing status, bouncing controls, or animation that delays reading.

Under `prefers-reduced-motion: reduce`, remove nonessential transition and animation duration, disable smooth scrolling, and preserve the final state without an intermediate effect. No information, focus change, or control outcome may depend on motion.

## responsive contracts

Responsive design recomposes the shell; it does not shrink every element.

| range | required behavior |
| --- | --- |
| below `48rem` | `92px` two-row header, centered compact provider tabs, compact utility group, mobile Sheet, no permanent rail, local scrolling for wide tables |
| `48rem` through `59.99rem` | `92px` two-row header, persistent collapsible guide rail, icon search control, no intermediate dual dropdown bar |
| `60rem` through `71.99rem` | `64px` one-row header, tighter provider and utility spacing, persistent guide rail |
| `72rem` and wider | `64px` full publication shell with wider article breathing room |

Required viewport checks are `375`, `768`, `1024`, and `1440` pixels. Add `320`, `942`, `959`, `960`, and widths immediately around `48rem` when a change touches boundaries.

At every width:

- no page-level horizontal overflow;
- no overlap between brand, provider navigation, utilities, title, and actions;
- title and page actions share a justified row whenever the available measure permits, including mobile;
- provider tabs remain centered, compact, and horizontally reachable;
- the active provider and chapter remain clear;
- controls remain operable by touch and keyboard;
- prose remains readable and tables retain lookup through local scrolling;
- overlays fit the dynamic viewport and safe-area insets.

Test at 200 percent text resize and with WCAG text-spacing overrides.

## accessibility

Accessibility is a release contract:

- one descriptive `h1` and ordered heading levels;
- a skip link and correct header, navigation, main, aside, and footer landmarks;
- visible keyboard focus with a cobalt outline or equivalent inset state;
- accessible names for icon-only controls;
- current location exposed with `aria-current` at the correct navigation layer;
- semantic tables and lists without decorative list markers leaking from component defaults;
- Dialog and Sheet focus containment, Escape handling, background isolation, and focus restoration;
- meaningful alt text and adjacent source attribution for evidence-bearing media;
- WCAG AA contrast in both themes and no information conveyed by color alone;
- reflow, 200 percent resize, text spacing, reduced motion, and touch target support.

Do not hide page overflow to conceal a broken component. Repair it or give a genuinely wide object a local scrolling region.

## performance and delivery

Keep static HTML, ordinary URLs, external shared CSS, and the existing Astro `ClientRouter`. Do not add React, global hydration, a service worker, analytics, another icon kit, or a third-party runtime for visual refinement.

Prefer CSS and semantic HTML for presentation. Prefetch likely provider and chapter destinations on intent; do not prefetch every page, citation, hash, image, or embed.

Use the established budgets for guide HTML, shared CSS, Starwind runtime JavaScript, fonts, and duplicate component code. Keep the console free of errors and actionable warnings. A visual flourish does not justify route latency, layout shift, input delay, privacy cost, or another failure mode.

## CSS and component discipline

The authored cascade has one owner per concern:

1. semantic tokens and Starwind theme compatibility;
2. typography;
3. shell;
4. publication;
5. guide navigation;
6. narrow Starlight interoperability overrides.

Put a rule in the narrowest owner that expresses its meaning. Prefer low-specificity semantic classes. Framework selectors and `!important` are limited to a documented Starlight or generated-component boundary with regression coverage.

Every new selector should answer:

- what semantic object does this name?
- which layer owns it?
- which token expresses each state?
- what happens in dark theme?
- what happens below `48rem` and below `60rem`?
- what happens under reduced motion?
- which focused check protects it?

Do not modify installed Starwind source to redesign it. Compose documented variants and map semantic tokens in `src/styles/starwind.css`. Custom browser code requires a documented behavior Starwind or Starlight cannot provide.

## reject generated-design reflexes

Do not ship:

- a generic centered hero followed by a card grid;
- cards for ordinary prose, recommendations, sources, or every navigation item;
- all-caps decorative eyebrows and redundant route labels;
- gradients, glows, blobs, glass, textures, fake depth, or ambient hero art;
- oversized provider marks in colored tiles;
- decorative terminal windows, simulated typing, or activity theater;
- a permanent right rail without a distinct reader task;
- decorative bullets, connector lines, or progress-timeline styling in the guide rail;
- arbitrary icon styles or icons duplicating visible labels;
- pills for ordinary metadata;
- tiny muted prose used to force density;
- nested panels and borders around every group;
- decorative motion or page reveal sequences;
- copied provider product UI;
- content generated to fill an underdesigned area.

Restraint must not flatten the publication. Strengthen a weak page through hierarchy, proportion, line breaks, density, and evidence placement. Keep supporting material quieter.

## change protocol

Begin every material design change read-only.

1. Verify the worktree, branch, base SHA, uncommitted files, preview owner, and task ownership.
2. Read the canonical Markdown and the nearest design, component, source, and test owners.
3. Capture the current route at the target viewport, theme, scroll position, and state.
4. Name the reader problem and the smallest system-level change that resolves it.
5. Implement in the owning file without changing public wording unless Ani requested that exact copy change.
6. Compare before and after at matching conditions.
7. Run focused checks while iterating and the full required suite before publication.
8. Record a durable rule here when the decision changes the system rather than one instance.
9. Keep design, content, and performance ownership separate when parallel work is active.
10. Report local, committed, pushed, pull request, merged, deployed, and live states separately.

A screenshot is evidence only when its route, viewport, theme, scroll position, branch, and source SHA are known. A local preview does not prove production.

## verification

Use the package scripts. A broad design change must pass:

```sh
bun run verify
```

Use focused checks during iteration:

```sh
bun run check
bun run check:content
bun run check:ui
bun run build
bun run test:site
bun run test:navigation
bun run test:dev-search
bun run test:a11y
bun run check:performance
```

Run `bun test plugins/cc/tests` and `pytest plugins/lore/tests` when archive or shared runtime surfaces change, and during scheduled full verification.

At minimum, visually inspect:

- homepage;
- one shared handbook page;
- Codex and Claude Code overviews plus one nested chapter each;
- Grok overview;
- light and dark themes;
- expanded and collapsed desktop rail;
- mobile Sheet, search, page actions, tables, image dialog, disclosures, and footer;
- keyboard focus, Escape, back and forward, hash links, and scroll restoration;
- 200 percent resize, text spacing, reduced motion, console output, and overflow.

The consistency coverage inventory is:

| surface | owner and regression coverage |
| --- | --- |
| header, provider tabs, theme, mobile Sheet | SiteHeader; navigation and accessibility checks |
| search trigger, input, results, clear and dismissal | upstream Starlight with shell styles; navigation and development search checks |
| chapter rail, outline, collapse and progress | StarlightSidebar; navigation and accessibility checks |
| page actions, portaled menu, clipboard and toast | StarlightPageTitle; navigation checks including scroll dismissal and typography |
| sources, hover cards, code controls, tables and image dialog | Markdown transformation and PublicationEnhancements; navigation and accessibility checks |
| homepage groups, footer, document typography and metadata | canonical route rendering; site and accessibility checks |

The accessibility sweep covers all canonical routes at eight widths in both
themes. Search also receives boundary-width visual checks. This is a defined
coverage matrix, not a guarantee about every browser or future content change.

## definition of done

A design change is complete when:

- it solves a named reader problem;
- it follows this authority or deliberately updates it;
- it preserves Ani's approved wording and evidence distinctions;
- first-read and study paths both work;
- provider, chapter, and section location remain clear;
- both themes and all required widths are coherent;
- keyboard, screen-reader, reduced-motion, no-script, and graceful fallback behavior remain sound;
- local and production search use the same current index behavior;
- credited media meets ownership, attribution, caption, alt text, and fallback rules;
- no unnecessary runtime, dependency, remote asset, or effect was introduced;
- focused and broad checks pass and the rendered result was inspected;
- repository and provider states are reported separately.

The final test is simple: the page should feel more like coding agent tips after the change: clearer, more personal, more useful, and more technically credible without looking busier or manufactured.
