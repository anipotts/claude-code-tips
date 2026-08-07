# 0001: repository identity

status: accepted

date: 2026-08-07

## context

the repository began as a collection of claude code tips, hooks, examples, and
plugins. its active work now covers codex, claude code, editor-centered systems,
orchestration, and local inference. the old name makes the wider scope look like
an accidental expansion rather than a deliberate publication.

## decision

rename the existing repository from `claude-code-tips` to `coding-agent-tips`.
preserve its history, stars, forks, and github redirects.

the public site name is `coding agent tips`. its canonical homepage heading is:

> a guide to coding agents in production software (projects, startups & big tech)

the heading is a copy lock. changing it requires a new decision record because
it defines the audience and the scope of the publication.

## reasons

- `coding-agent-tips` preserves the useful continuity of the original name.
- the name remains legible when codex and claude code change independently.
- retaining the repository keeps its public implementation history inspectable.
- a product-neutral name makes room for editors, orchestration, and local models
  without presenting them as claude code extensions.

## alternatives considered

`coding-agent-field-guide` described the editorial form precisely but discarded
the established `tips` identity. `coding-agent-lab` made the research method sound
like the whole product. a new repository would have produced a cleaner break at
the cost of fragmenting the history and compatibility paths.

## consequences

the github description, topics, homepage URL, release notes, and issue state must
change as one public cutover. legacy plugin install paths remain available through
the compatibility window described in [0004](./0004-legacy-retirement.md).

## verification

- the exact heading appears once on the rendered homepage.
- repository and site metadata use `coding agent tips` consistently.
- old github repository links redirect after the rename.
