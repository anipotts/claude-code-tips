# 0005: publication shell and editorial density

date: 2026-08-09

status: accepted

## context

the homepage and starlight pages used different header heights, gutters, rail
boundaries, and mobile offsets. the homepage also presented an evidence rail
that ended with the hero while documentation pages used evidence as a fixed
reading aid. labels repeated context already established by the page title,
route, or article body.

## decision

- use one 64-pixel header and one horizontal gutter system on every route.
- remove the decorative homepage evidence rail. evidence remains attached to
  guide pages where it can support a claim or link to its source.
- remove starlight's unused mobile table-of-contents offset.
- keep desktop navigation and evidence columns full height. collapse page
  evidence into a disclosure on narrow screens so article content appears in
  the first viewport.
- keep the four primary destinations available from every mobile route.
  starlight pages retain the framework menu; standalone pages use a native
  disclosure in the shared header.
- show a build-time verified GitHub star count beside the GitHub icon. store the
  value and verification date in one repository-owned data module.
- remove mid-dot dividers. remove labels that only repeat nearby context.

## rejected options

- extending the homepage evidence rail through every section would preserve the
  original visual motif but add a permanent empty column without a reading task.
- loading the GitHub count in the browser would be fresher but would add a
  network dependency, visible count changes after load, and another failure mode.
- replacing starlight's shell would offer total layout control while discarding
  its navigation, search, semantics, and accessibility foundation.

## consequences

- the homepage is a publication cover; guide routes use the reading shell.
- the two surfaces share header geometry, gutters, type, and controls without
  pretending they need identical sidebars.
- the star count is honest as of its recorded date and must be refreshed during
  material publication updates.
- evidence remains available on mobile without dominating the initial screen.
- standalone pages no longer lose primary navigation when the desktop links
  collapse.

## verification

- compare homepage and methodology renders at 375, 768, 1024, and 1440 pixels.
- verify the header is 64 pixels on every route.
- verify the mobile article begins immediately below the header.
- verify the built site contains no mid-dot characters.
- verify the GitHub link exposes its star count to sighted and screen-reader users.
