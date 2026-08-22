---
title: working with coding agents
description: durable instructions, evidence, isolation, approvals, verification, and handoffs across coding agent runtimes.
products: [codex, claude-code]
lastVerified: 2026-08-07
status: current
evidence: [tested, official-source, analysis]
sources: [openai-codex-manual, anthropic-features-overview, git-worktrees]
redirects: []
voice: evidence
navigation:
  group: practice
  order: 30
---

codex and claude code expose different native controls. the durable engineering principles underneath them are similar.

## begin with repository truth

an agent should know:

- what the system does and where its boundaries are.
- the commands that verify a change.
- the local conventions that materially affect implementation.
- which operations require approval.
- what evidence is sufficient before claiming completion.

keep these facts in `AGENTS.md`, `CLAUDE.md`, or checked in project documentation. duplicate only the small amount required for native discovery. when possible, make one file reference or mirror the other so the two runtimes cannot drift silently.

## separate guidance from enforcement

instructions shape judgment. config constrains the runtime. hooks intercept lifecycle events. operating system and provider policy set harder boundaries.

use prose for decisions that need context. use mechanical controls for invariants that can be evaluated deterministically. a command blocklist cannot replace review of a deployment, and a paragraph cannot guarantee that a destructive command is rejected.

## use evidence to resolve uncertainty

good agent work turns uncertainty into a bounded check:

| uncertainty | useful evidence |
|---|---|
| where behavior is implemented | repository search, call graph, or runtime trace |
| whether a change works | targeted test plus the relevant integration check |
| whether a release is current | official documentation or release metadata |
| whether a branch is safe to publish | clean diff, passing checks, and authority for the destination |
| whether work can run in parallel | independent files, processes, resources, and acceptance criteria |

plans should name these checks. otherwise a detailed plan can still be speculation.

## isolate work by ownership

use one branch or worktree per independently reviewable change. parallel agents need explicit ownership of files, subsystems, or responsibilities.

git isolation covers tracked files and branches. runtime resources remain shared, so check ports, databases, local services, browser profiles, caches, generated files, and external accounts before running several implementations at once.

## keep the main thread clean

the main thread should hold the goal, constraints, decisions, and final evidence. delegate noisy repository exploration, long test output, log analysis, or independent review when the work is truly separable.

parallelism is useful when the tasks are independent and their results can be compared or combined cheaply. it is wasteful when several agents need the same evolving state or edit the same files.

## preserve human control at the right boundary

approval should follow consequence:

- local reversible edits can usually proceed inside the requested task.
- commits should remain scoped and attributable.
- pushes and pull requests should follow repository policy and the requested publication path.
- deployments, external messages, account changes, secrets, and destructive cleanup need explicit authority.

an approval is strongest when it names the actor, target, operation, scope, and expiration.

## verify completion

a credible completion report states:

- what changed.
- what was tested.
- untested scope.
- what remains gated or uncertain.

avoid using a generated file, passing unit test, green deployment job, or visible preview as proof of a different layer. each claim needs evidence from the layer it describes.

## hand off durable state

chat memory is convenient and private to a runtime. another engineer should be able to continue from repository state and a concise handoff.

a useful handoff records the goal, changed files or commits, verification, unresolved decisions, and the next safe action. avoid copying full transcripts into a public repository.

## review the whole system

agent generated code should be reviewed for:

- correctness and failure behavior.
- security and authority boundaries.
- fit with the existing architecture.
- maintenance cost and observability.
- whether the verification actually proves the claim.
- whether the change is easier to understand than the system it replaces.

the same standard applies to agent infrastructure. a small, well understood workflow can outperform a large control plane.
