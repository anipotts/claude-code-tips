---
title: field lab
description: reproducible scenarios, sanitized run records, public artifacts, and explicit limitations.
products: [codex, claude-code]
lastVerified: 2026-08-11
status: current
evidence: [hands-on, inference, unknown]
sources: []
evidenceRail:
  - kind: hands-on
    label: site launch with codex
    section: published-runs
  - kind: hands-on
    label: dependency maintenance with codex
    section: published-runs
  - kind: inference
    label: operator-centered protocol
    section: interpretation
  - kind: unknown
    label: claude code rerun pending
    section: published-runs
---

the field lab evaluates coding-agent systems through repeatable engineering work.
it measures what the operator must understand, supervise, recover, and verify.
its output is comparable run evidence rather than a single winner score.

## protocol

each primary harness is evaluated against the same repository state and task
specification. a run should exercise:

1. architecture inspection with file-level evidence.
2. planning before a multi-file change.
3. implementation with repository-native verification.
4. interruption, denial, failure, and recovery.
5. session continuity and durable-state recovery.
6. delegated analysis with a bounded result.
7. isolated work in a separate worktree.
8. final diff review and completion evidence.

the task specification defines pass conditions before the agent begins. a run
records failed scenarios and operator interventions rather than editing them out.

## published runs

the first baseline records codex implementing the v4 publication from commit
`60aa685`. the public task specification is this repository's accepted launch plan.
the [codex publication baseline](/field-lab/runs/codex-publication-baseline-2026-08-07/)
publishes completed scenarios, skipped scenarios, artifacts, redactions, and
limitations together.

the [dependency maintenance run](/field-lab/runs/codex-dependency-maintenance-2026-08-11/)
starts from a public task specification, updates the compatible astro and
accessibility packages, and records why typescript 7 remains deferred. it also
records skipped protocol scenarios and measurements that were unavailable.

the paired claude code launch run is pending. current claude code guidance
remains source-verified until that run is performed from the launch baseline's
base commit and task specification.

## published data

run records conform to the repository [run schema](https://github.com/anipotts/coding-agent-tips/blob/main/docs/field-lab/run.schema.json).
each record lives at `runs/<run-id>.json`; its task specification and compact
supporting evidence live together under `runs/<run-id>/`. public artifacts may
include commits, pull requests, test logs, screenshots, and concise design-review
notes.

exclude these from every public run:

- raw chat or agent transcripts.
- credentials, environment values, or account identifiers.
- private repository names or private absolute paths.
- personal data unrelated to the engineering result.
- inferred token cost when the product leaves it unavailable.
- a success claim without evidence from the layer it describes.

## interpretation

elapsed time is useful only with operator interventions and review time beside it.
tool-call count can describe a run. quality requires review evidence from the resulting work. resource
measurements must identify what ran locally and what remained provider-hosted.

comparative conclusions require comparable runs. a missing run remains visible as
`pending` until comparable hands-on evidence exists.
