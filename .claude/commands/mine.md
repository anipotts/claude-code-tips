---
name: mine
description: usage stats, costs, search, tools
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
  - CronCreate
  - CronDelete
  - CronList
---

# /mine

one command for everything in your usage data. just ask what you want to know in plain language

## examples

```
/mine                          → 7-day dashboard with projects, tools, models, insights
/mine how much have i spent    → cost breakdown by project, model, daily trend
/mine value                    → full API inference value, per-project, per-model, ROI
/mine search "websocket"       → full-text search across all conversations
/mine what's my cache hit rate → cache efficiency, savings estimate, what-if, trend
/mine wasted sessions          → expensive failures, error ratios, worst offenders
/mine top projects             → all projects ranked by API value, cache rate
/mine top tools                → tool usage with "other" accounting
/mine story claude-code-tips   → narrative history of a project's lifecycle
/mine compare this week vs last → side-by-side delta comparison
/mine health                   → codebase size, git activity, tests
/mine backfill                 → re-mine recent sessions into the database
/mine watch                    → scheduled dashboard refresh
```

<!-- PROMPT:START — keep in sync with plugins/mine/skills/mine/SKILL.md -->
The content of this command is identical to plugins/mine/skills/mine/SKILL.md (lines 18 onwards, between the PROMPT:START and PROMPT:END markers). To avoid duplication in the repo, refer to that file as the source of truth. When the skill is loaded as a plugin, the SKILL.md is used directly. When invoked as a /mine command, this file is used — but the prompt content is the same.

See plugins/mine/skills/mine/SKILL.md for the full prompt.
<!-- PROMPT:END -->
