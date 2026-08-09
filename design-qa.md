# design qa

date: 2026-08-09

result: passed

## reference

the approved homepage concept and guide concept define the publication's visual
direction. canonical markdown overrides any accidental mockup wording.

## concept-to-render fidelity

| decision | reference intent | implementation | result |
|---|---|---|---|
| palette | white field, ink type, cobalt links, sparse warning red | exact locked hex values in global tokens | pass |
| typography | editorial sans with technical monospace metadata | self-hosted instrument sans and ibm plex mono | pass |
| structure | open bands, rules, tables, and visible evidence | border-led homepage bands and starlight article shell | pass |
| homepage hierarchy | publication identity, canonical h1, system taxonomy, operating-model chooser | canonical h1 appears once; taxonomy and chooser remain distinct | pass |
| guide hierarchy | navigation, readable article column, claim evidence | starlight navigation plus a dedicated evidence rail | pass |
| publication shell | home and guide pages feel like one system | one 64px header and a shared desktop content line | pass |
| narrow screens | evidence meaning survives without dominating the first viewport | a closed evidence disclosure sits beneath page metadata | pass |
| field-run language | internal identifiers remain inspectable without dominating the reader experience | the page names the coding agent tips site directly, uses plain-language section headings, and keeps stable ids in data and urls | pass |
| active navigation | current location is obvious without sacrificing legibility | cobalt background with white text and a darker hover state | pass |
| evidence rail | evidence remains distinct without looking detached from the page | a full-height soft-gray rail holds only entries relevant to the current page | pass |
| repository signal | github is recognizable and useful at a glance | the github icon includes 27 stars, verified on 2026-08-09 | pass |
| editorial economy | labels carry information instead of repeating context | redundant page kickers and decorative evidence labels are removed; mid-dot dividers are prohibited | pass |
| decoration | no gradients, generic cards, logos, dashboards, or ornamental motion | none introduced; functional icons use the pinned phosphor set | pass |

## responsive review

| viewport | homepage overflow | guide overflow | evidence behavior |
|---:|---|---|---|
| 375 | none | none | closed disclosure |
| 768 | none | none | closed disclosure |
| 1024 | none | none | closed disclosure |
| 1440 | none | none | full-height desktop rail |

## deliberate differences

- the homepage does not reproduce the guide evidence rail. that rail only adds
  value when it maps evidence to article claims.
- the guide uses starlight's persistent section navigation instead of the
  concept's custom contents rail. this preserves the chosen framework's search,
  keyboard, and documentation-navigation behavior.
- github destinations use the familiar github icon in site chrome, which is
  faster to scan on the mobile-first header than an uppercase text label.
- screenshots remain pull-request review artifacts instead of repository
  binaries.

## final checks

- homepage and guide renders were compared directly with their approved
  concepts at the same desktop viewport.
- the home and methodology shells were compared before and after the revision
  at desktop and mobile widths.
- the canonical h1 is readable without clipping on desktop and mobile.
- the page starts immediately below the header at every reviewed width. no
  unused mobile table-of-contents spacer remains.
- visible focus treatment is defined globally and reduced motion is honored.
- no public copy or interface label uses a mid-dot divider.
- the publication contains no fake run result or fresh claude code hands-on
  claim.
