# 0003: site architecture

status: accepted

date: 2026-08-07

## context

the repository needs a public reading surface without creating a second editorial
source or a large application runtime. github markdown must remain useful to a
reader who encounters the source before the deployed site.

## decision

use Astro with Starlight to render canonical markdown as a static site. use Bun
for the root package workflow. publish through github pages at
`https://agents.anipotts.com`.

the design is a restrained technical field manual. a functional evidence rail
aligns provenance with claims. the interface uses open bands, tables, lists, and
rules instead of card grids or decorative dashboards.

## reasons

- static output has a small runtime and a narrow security surface.
- Starlight supplies documentation routing, search, navigation, and accessible
  defaults while allowing deliberate component overrides.
- canonical markdown keeps pull-request review and github browsing straightforward.
- github pages connects the publication directly to the source and release history.

## alternatives considered

a custom React application offered more visual freedom but added client runtime,
state, and maintenance without improving the guide. github markdown alone kept the
repository simple but could not provide the evidence rail, responsive navigation,
or one coherent reading surface. a separate site repository would create content
drift.

## consequences

site components must treat content as data rather than duplicate it. the site
build, accessibility scan, route checks, and exact heading check become release
requirements. the custom domain remains a gated external change.

## verification

- the static build contains every documented public route.
- desktop and mobile renders match the approved visual references.
- the site works without client-side JavaScript beyond search and navigation.
- canonical metadata and the sitemap use `https://agents.anipotts.com`.
