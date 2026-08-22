---
title: building the coding agent tips site with codex
description: the first public edition, including completed work, skipped scenarios, review evidence, and limits.
date: 2026-08-07
status: partial
evidence: [tested, open-question]
sources: []
voice: documentary
product: codex
model: null
version: 0.146.0
surface: codex desktop
baseCommit: 60aa685374688fbe34194478c49661ae1597032b
task: build the first public edition of coding agent tips from the approved publication plan.
passCondition: the site builds, the canonical identity is present, principal routes resolve, evidence stays visible, and responsive review is recorded.
humanInterventions: 0
reviewMinutes: null
machine:
  platform: macos, darwin 25.5.0
  architecture: arm64
  memoryGb: null
  notes: memory capacity was not recorded and model inference was hosted by the provider.
artifacts:
  - kind: commit
    url: https://github.com/anipotts/coding-agent-tips/commit/a88259c
    description: field lab and decision record
  - kind: commit
    url: https://github.com/anipotts/coding-agent-tips/commit/c340f65
    description: publication implementation
  - kind: commit
    url: https://github.com/anipotts/coding-agent-tips/commit/184632a
    description: mobile field run language and GitHub icon revision
  - kind: commit
    url: https://github.com/anipotts/coding-agent-tips/commit/d6d58e5
    description: responsive publication shell and editorial density revision
  - kind: commit
    url: https://github.com/anipotts/coding-agent-tips/commit/18186e7
    description: standalone mobile navigation and spacing revision
  - kind: historical evidence
    url: https://github.com/anipotts/coding-agent-tips/blob/8809021ddf8f760fa8711e1d9e467ad62dac1a4a/docs/field-lab/runs/codex-publication-baseline-2026-08-07/checks.md
    description: immutable command and browser check ledger
  - kind: historical evidence
    url: https://github.com/anipotts/coding-agent-tips/blob/8809021ddf8f760fa8711e1d9e467ad62dac1a4a/docs/field-lab/runs/codex-publication-baseline-2026-08-07/design-review.md
    description: immutable concept and responsive review ledger
privacy:
  - raw conversation and tool transcripts were excluded
  - absolute local filesystem paths were excluded
  - machine name and account identifiers were excluded
limitations:
  - the model identifier was unavailable on the public run surface
  - start time, scenario durations, memory capacity, and review time were not recorded
  - token use and cost estimates were unavailable
  - delegated analysis and a separate worktree scenario were skipped
openQuestions:
  - the comparable current claude code run remains pending
  - production hosting and custom domain behavior were outside this local baseline
---

## what worked & what failed

| scenario | result | evidence and limits |
|---|---|---|
| understand the existing system | pass | the evidence model, site architecture, repository identity, and legacy policy were recorded in [the decision commit](https://github.com/anipotts/coding-agent-tips/commit/a88259c) before the site build |
| set the plan and public boundaries | pass | pass conditions and public action gates were explicit before publication work; the original specification remains available in [immutable history](https://github.com/anipotts/coding-agent-tips/blob/8809021ddf8f760fa8711e1d9e467ad62dac1a4a/docs/field-lab/runs/codex-publication-baseline-2026-08-07/task-specification.md) |
| build the publication | pass | signed commits built the Astro and Starlight publication, route set, metadata, and responsive evidence presentation |
| find problems and recover | pass | schema coercion, icon integration, and generated route link failures were found and corrected during the build loop |
| preserve decisions across the work | partial | decisions were persisted in signed commits and repository records; resumed session recovery was not exercised |
| delegate a bounded review | skipped | delegation was outside the execution policy for this run |
| work in a separate checkout | skipped | the implementation used the existing branch and checkout |
| review the result | pass | the production build, identity, responsive layouts, evidence behavior, and concept fidelity were reviewed in the linked immutable ledgers |

## interpretation

this run proves the recorded implementation and review steps. it leaves model identity, elapsed time, resource use, and the paired claude code comparison open.
