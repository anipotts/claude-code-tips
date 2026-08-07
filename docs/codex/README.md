---
title: codex field guide
description: operating codex across cli, desktop, ide, cloud, worktrees, permissions, and durable configuration.
products: [codex]
lastVerified: 2026-08-07
status: current
evidence: [hands-on, source-verified, inference]
sources: [openai-codex-manual, git-worktrees]
evidenceRail:
  - kind: source-verified
    label: codex manual
    section: current-shape
    sourceId: openai-codex-manual
  - kind: source-verified
    label: git worktree behavior
    section: worktrees-and-parallelism
    sourceId: git-worktrees
  - kind: hands-on
    label: codex-cli 0.146.0
    section: the-working-loop
  - kind: inference
    label: professional default
    section: professional-default
---

evidence: hands-on through `codex-cli 0.146.0`; source-verified through 0.147.0

last verified: 2026-08-07

primary source: [official codex manual](https://developers.openai.com/codex/codex-manual.md)

## current shape

codex is a coding-agent system with several surfaces that share a runtime and configuration model:

| surface | best fit | main tradeoff |
|---|---|---|
| cli | terminal-first local work and scripting | less visual coordination across many threads |
| chatgpt desktop app | planning, review, worktrees, browser use, scheduled work, and handoffs | another application beside the editor |
| ide extension | editor-attached work with selections, diagnostics, and inline review | the editor becomes the primary session shell |
| cloud | isolated or offloaded tasks that should continue away from the local machine | environment parity and remote-state review |

the desktop app changes the operating model more than a visual wrapper would. it gives threads, terminals, diffs, worktrees, previews, browser and computer-use tools, memories, and scheduled work a common review surface.

## durable configuration

use the smallest durable surface that matches the rule:

| need | codex surface |
|---|---|
| repository conventions and verification commands | `AGENTS.md` |
| trusted project settings, mcp, hooks, sandbox, or model defaults | `.codex/config.toml` and related project config |
| reusable workflow or reference material | skill |
| distributable skills, mcp, hooks, assets, or apps | plugin |
| external tools and live data | mcp server or app connector |
| mechanical lifecycle enforcement | hook |
| recurring background work | scheduled task in the desktop or web surface |

keep required team rules in version control. memory is useful recall, not the only copy of a constraint that must always apply.

## the working loop

1. start with a concrete outcome, relevant constraints, and a verification target.
2. use plan mode when the work contains a consequential choice, a migration, or broad edits.
3. let codex inspect before it writes. good plans name the evidence that will resolve uncertainty.
4. keep implementation and verification in the same thread when the feedback is directly useful.
5. move noisy exploration, log reading, or independent review into subagents.
6. inspect the final diff and verification output before accepting a completion claim.

codex responds well to an explicit terminal condition: what must be true, what proof is required, and which actions still need approval.

## worktrees and parallelism

the desktop app can create codex-managed worktrees for parallel chats. this is usually the cleanest local default when two tasks should produce independent diffs.

worktrees isolate tracked files and branches. they do not eliminate shared resources. package caches, local databases, ports, browser profiles, running services, and external accounts can still collide.

use subagents for read-heavy parallel work such as repository exploration, test triage, source research, or independent review. use separate worktrees when agents need to edit independently or run conflicting application instances.

parallel write-heavy work has a coordination cost. assign file or subsystem ownership and require each worker to report its verification.

## app, terminal, and ide handoff

choose the surface by the next review action:

- stay in the cli when commands and output are the main evidence.
- move to the app when several threads, a browser, previews, or worktrees need one attention surface.
- use the ide extension when selection context, debugging, and inline diffs dominate.
- use cloud work when the task benefits from isolation or should continue without the local machine.

changing surfaces can preserve the same project context, but it does not guarantee identical tools or permissions. verify the effective environment after a handoff.

## permissions and automation

codex separates sandbox access, approval behavior, command rules, hook trust, and managed requirements. treat them as different controls.

- start with workspace-scoped write access for normal local development.
- grant network or broader filesystem access only for the task that needs it.
- review project hooks before trusting them.
- run unattended scheduled tasks in isolated worktrees when they can edit code.
- keep destructive, account-level, deployment, and secret-bearing actions behind explicit authority.

scheduled tasks use unattended approval behavior when policy permits it. test the prompt manually and review early runs before relying on the schedule.

## memories

local codex memories can summarize useful context from eligible prior chats. they are off by default and live under the codex home directory.

use memory for preferences, recurring context, and useful recall. use `AGENTS.md`, checked-in docs, config, or a skill for requirements another engineer must be able to inspect and reproduce.

review generated memory before sharing codex state. secret redaction reduces risk but does not make the entire state directory appropriate for publication.

## where older comparisons went wrong

codex now supports skills, plugins, hooks, mcp, subagents, memories, worktrees, browser and computer use, noninteractive operation, and scheduled tasks across its supported surfaces. descriptions that reduce it to a terminal agent with limited extension points are obsolete.

the stronger comparison is operational: codex combines a local terminal runtime with a broad first-party desktop surface. that can reduce context switching, while the additional surfaces require clearer thinking about where state, permissions, and execution actually live.

## professional default

for a mac-based engineer who already works comfortably in the terminal, start with the codex cli and desktop app as one system. add the ide extension when editor context improves a real workflow. add an external orchestration layer only when the first-party thread and worktree model is the demonstrated bottleneck.
