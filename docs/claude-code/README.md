---
title: claude code
description: source-verified guidance for claude code terminal, desktop, ide, agents, hooks, and permissions.
products: [claude-code]
lastVerified: 2026-08-07
status: pending
evidence: [source-verified, unknown]
sources: [anthropic-claude-overview, anthropic-features-overview, anthropic-desktop]
evidenceRail:
  - kind: source-verified
    label: claude code overview
    section: current-shape
    sourceId: anthropic-claude-overview
  - kind: source-verified
    label: current features
    section: skills-hooks-plugins-and-agents
    sourceId: anthropic-features-overview
  - kind: source-verified
    label: desktop documentation
    section: desktop-and-context-switch-cost
    sourceId: anthropic-desktop
  - kind: unknown
    label: current hands-on rerun pending
    section: professional-default
---

primary source: [official claude code documentation](https://code.claude.com/docs/en)

local note: 2.1.220 is installed. the current hands-on protocol in [methodology](/method/) remains pending for this reset, so recommendations that depend on current product behavior use source-verified evidence.

## current shape

claude code is a coding-agent system available through terminal, desktop, ide, web, and remote workflows.

| surface | best fit | main tradeoff |
|---|---|---|
| terminal | direct local work, fast steering, and shell-heavy repositories | less visual control over many simultaneous sessions |
| desktop | parallel sessions, git isolation, diffs, previews, terminals, side chats, computer use, and pull-request monitoring | another application and another workspace model to understand |
| ide | editor context, diagnostics, diffs, and familiar navigation | the session becomes coupled to the editor surface |
| web and remote control | continuing or supervising work away from the original terminal | remote state and permission boundaries need deliberate review |

## durable configuration

choose an extension point by how it should load:

| need | claude code surface |
|---|---|
| repository conventions that load every session | `CLAUDE.md` |
| modular project rules | `.claude/rules/` |
| reusable knowledge or workflow loaded on demand | skill |
| isolated specialist that returns a result | subagent |
| coordinated independent sessions | agent team |
| external data or actions | mcp server |
| deterministic lifecycle behavior | hook |
| packaged distribution | plugin and marketplace |

keep `CLAUDE.md` short enough to remain legible. large reference material belongs in skills, checked-in documents, or scoped rules.

## the working loop

1. state the outcome, constraints, and acceptable proof.
2. use plan mode when the task needs a decision before edits begin.
3. steer during execution when new evidence changes the approach.
4. use checkpoints or git commits before risky transformations.
5. delegate independent research or review to subagents.
6. use worktree-isolated sessions when independent edits should remain separately reviewable.

claude code is strongest when the user treats it as an operating environment with inspectable rules and tools, rather than relying on a single large prompt.

## skills, hooks, plugins, and agents

these features solve different problems:

- a skill carries reusable instructions and reference material.
- a subagent gets isolated context for bounded work.
- a hook runs on a lifecycle event and can enforce or automate a mechanical rule.
- a plugin packages skills, hooks, subagents, mcp servers, and related configuration.
- an agent team coordinates separate sessions that need shared tasks or peer communication.

agent teams are experimental and disabled by default in current official guidance. use them when peers need to coordinate with each other. prefer a subagent when the main session only needs a focused result.

third-party plugins run with meaningful local access. review their hooks, commands, mcp servers, storage, and update path before installation.

## desktop and context-switch cost

claude code desktop combines chats, diffs, previews, files, plans, tasks, terminals, and subagent views. this can reduce the attention cost of moving among a terminal, browser, editor, and pull-request page.

the desktop benefit is supervision. compute use can still grow as local sessions duplicate worktrees, dependencies, build processes, file watchers, browser instances, and model requests.

## permissions and safety

permission mode, sandboxing, hooks, managed policy, and operating-system access are separate layers.

- use narrow allow rules for routine commands.
- keep bypass modes inside disposable or strongly isolated environments.
- distinguish a local write from an outbound action such as publishing, deploying, or messaging.
- inspect plugin and mcp provenance before granting access.
- preserve user approval for destructive or difficult-to-reverse actions.

treat each hook as enforcement for the events and payloads it receives. test bypasses and failure behavior before assigning it responsibility for a security boundary.

## memory and session continuity

claude code supports `CLAUDE.md`, auto memory, session resume, remote control, and desktop-managed sessions. these are complementary.

use checked-in instructions for rules the team must share. use auto memory for learned local context. use session resume when the original conversation remains the right unit of work. use a written handoff when another person or runtime must continue without depending on hidden chat state.

## professional default

for an engineer who prefers direct terminal steering, start with claude code terminal plus a concise `CLAUDE.md`. add desktop when parallel sessions and visual review become frequent. introduce custom hooks, plugins, or agent teams only after a repeated workflow proves the maintenance cost is justified.
