---
title: archived claude code tools
description: the older plugins and hooks that remain available during their promised compatibility window.
products: [cc, lore, time]
updatedAt: "2026-08-22T19:55:02-04:00"
status: archive
evidence: [official-source, open-question]
sources: [anthropic-features-overview]
redirects: [/legacy/]
voice: frozen
navigation:
  scope: general
  order: 90
---

these tools predate the current handbook. they remain available through
november 5, 2026 so existing installations have time to move.

## install paths that still work

```text
/plugin marketplace add anipotts/claude-code-tips
/plugin install cc@anipotts
/plugin install lore@anipotts
/plugin install time@anipotts
```

the standalone hooks under `hooks/` remain in place during the same window.

## what happens next

the archive receives compatibility and security fixes only. on november 5,
2026, the final state will be preserved in the signed tag
`legacy-tools-final-2026-11-05` and removed from the default branch.

the current replacements are native agent instructions, skills, hooks, git
history, and the guides on this site.
