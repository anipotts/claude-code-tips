# design qa

date: 2026-08-07

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
| narrow screens | evidence meaning survives without a side rail | evidence summary moves directly beneath page metadata | pass |
| field-run language | internal identifiers remain inspectable without dominating the reader experience | the page names the coding agent tips site directly, uses plain-language section headings, and keeps stable ids in data and urls | pass |
| active navigation | current location is obvious without sacrificing legibility | cobalt background with white text and a darker hover state | pass |
| decoration | no gradients, generic cards, logos, dashboards, or ornamental motion | none introduced; functional icons use the pinned phosphor set | pass |

## responsive review

| viewport | homepage overflow | guide overflow | evidence behavior |
|---:|---|---|---|
| 375 | none | none | inline summary |
| 768 | none | none | inline summary |
| 1024 | none | none | inline summary |
| 1440 | none | none | desktop rail |

## deliberate differences

- the implemented homepage uses more vertical space than the concept so the
  canonical h1 remains readable at 200 percent zoom and does not compete with
  the taxonomy.
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
- the canonical h1 is readable without clipping on desktop and mobile.
- visible focus treatment is defined globally and reduced motion is honored.
- the publication contains no fake run result or fresh claude code hands-on
  claim.
