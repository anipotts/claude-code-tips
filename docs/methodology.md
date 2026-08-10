---
title: methodology
description: evidence labels, source policy, freshness windows, and the reproducible hands-on protocol.
products: [cross-runtime]
lastVerified: 2026-08-07
status: current
evidence: [hands-on, source-verified, inference, unknown]
sources: []
evidenceRail:
  - kind: hands-on
    label: reproducible field runs
    section: hands-on-protocol
  - kind: source-verified
    label: primary-source policy
    section: source-order
---

## evidence labels

every material recommendation uses one of four labels:

| label | meaning |
|---|---|
| hands-on | reproduced by the author in a named environment and version |
| source-verified | confirmed in current primary documentation or source code |
| inference | a judgment derived from observed capabilities, labeled as such |
| unknown | current evidence is missing or insufficient |

vendor benchmark results remain vendor claims unless independently reproduced. they can describe a model release, but they do not establish the best workflow for a reader.

## source order

use sources in this order:

1. official product documentation or specification.
2. official repository, release notes, or package metadata.
3. reproducible local observation.
4. third-party reporting for context, clearly identified.

product pricing and availability can change quickly. reserve copied static values for decisions that require them; otherwise link to the live official page.

## freshness

the source registry uses these review windows:

| material | maximum age |
|---|---|
| pricing and plan limits | 14 days |
| core codex and claude code guidance | 30 days |
| source-verified watchlist products | 45 days |
| stable cross-runtime principles | 90 days |

an upstream version change triggers review even when a page remains inside its time window.

the freshness workflow has read-only permissions and reports drift through a concise failed check. publication remains a human-reviewed workflow.

## hands-on protocol

the same disposable repository should be used to evaluate a primary coding harness:

1. inspect an unfamiliar code path and explain the architecture with file references.
2. plan a multi-file change without writing, then incorporate review feedback.
3. implement the change and run the relevant tests.
4. resume the session and recover the important constraints.
5. delegate independent analysis without polluting the main thread.
6. isolate a second implementation in a worktree and compare the results.
7. exercise permission denial, interruption, and a failed command.
8. review the final diff and completion evidence from the product surface.

record the product version, model, reasoning setting, machine, surface, repository state, elapsed time, and failures. reliability claims require repeated, comparable evidence.

## editorial standard

the guide is opinionated, but the reasoning must remain inspectable.

- facts receive sources.
- observations receive dates and environments.
- recommendations explain the decision they optimize.
- unknowns stay visible.
- products are compared at the same layer.
- personal taste is stated directly instead of being disguised as consensus.
- repeat a title, route, or surrounding label only when the repetition improves understanding.
- omit mid-dot dividers from public copy and interface labels.
- state claims directly and omit litotes or negative comparison frames.
