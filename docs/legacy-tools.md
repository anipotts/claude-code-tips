---
title: legacy claude code tools
description: compatibility and retirement policy for the historical cc, lore, time, hook, and example surfaces.
products: [cc, lore, time]
lastVerified: 2026-08-07
status: legacy
evidence: [source-verified]
sources: [anthropic-features-overview]
evidenceRail:
  - kind: source-verified
    label: current native features
    section: why-the-tools-are-retiring
    sourceId: anthropic-features-overview
  - kind: unknown
    label: no automatic migration parity
    section: migration
---

status: retired from active development

compatibility window: 2026-08-07 through 2026-11-05

## what remains available

the existing claude code marketplace paths remain unchanged during the compatibility window:

```text
/plugin marketplace add anipotts/claude-code-tips
/plugin install cc@anipotts
/plugin install lore@anipotts
/plugin install time@anipotts
```

the standalone hooks under `hooks/` also remain in place.

## maintenance policy

accepted changes are limited to:

- a validated security issue.
- a realistic data-loss risk.
- an installation blocker on a supported platform.
- a compatibility break caused by a current claude code release.

new features, codex ports, broader product work, generated documentation, and speculative refactors are out of scope.

## why the tools are retiring

the useful ideas have moved into first-party products or are better expressed as operating guidance:

- codex and claude code now provide richer native session, worktree, subagent, hook, plugin, and memory systems.
- maintaining a second coordination layer creates compatibility and trust costs.
- transcript analytics require careful retention, privacy, and schema ownership.
- resource estimates derived from undocumented client state are fragile.

the plugin code remains useful as an implementation record. it is no longer the public center of the repository.

## migration

| legacy tool | preferred direction |
|---|---|
| `cc` session mesh | first-party app session views, explicit worktree ownership, and durable handoffs |
| `lore` transcript database | native memory for recall plus checked-in decisions for shared truth |
| `time` meters | provider usage surfaces and smaller, reviewable task boundaries |
| safety hooks | current native hooks, sandboxing, permission rules, and managed policy |

there is no automatic migration that preserves every behavior. export any data you want to keep and review it for sensitive content before moving or sharing it.

## end of window

after 2026-11-05, the final compatible state will be preserved in an immutable git tag. plugin, hook, and product-specific example code can then leave the default branch through a reviewed change. repository history and tagged source will remain available.
