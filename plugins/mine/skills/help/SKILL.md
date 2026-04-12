---
name: help
description: all /mine intents, examples, and setup
---
<!-- tested with: claude code v2.1.81 -->

# /mine help

## what you can ask

| intent | examples |
|---|---|
| dashboard | `/mine` or `/mine today` |
| costs | `/mine how much have i spent` or `/mine cost this month` |
| value/ROI | `/mine value` or `/mine roi` |
| search | `/mine search "websocket"` or `/mine find auth bug` |
| cache | `/mine cache hit rate` |
| projects | `/mine top projects` or `/mine project myapp` |
| tools | `/mine top tools` |
| models | `/mine compare models` |
| mistakes | `/mine mistakes` or `/mine wasted sessions` |
| hotspots | `/mine hotspots` or `/mine most edited files` |
| loops | `/mine loops` or `/mine where am i stuck` |
| workflows | `/mine tool chains` |
| compare | `/mine compare this week vs last week` or `/mine project-a vs project-b` |
| project detail | `/mine project myapp` or `/mine about myapp` |
| story | `/mine story of myapp` or `/mine history of myapp` |
| health | `/mine health` or `/mine stats` |
| time filter | `/mine this week` or `/mine january` |
| backfill | `/mine backfill` or `/mine refresh` |
| watch | `/mine watch` or `/mine every 30 minutes` — scheduled dashboard |
| freeform | `/mine anything else` — builds a query from your question |

## scope

`/mine` auto-detects your scope based on the current directory:
- **project** — if your cwd matches a project in mine.db, defaults to just that project
- **global** — if no match, shows all projects

say "global" or "project" to switch. the scope shows in the freshness line at the top of every output.

## data

all data comes from `~/.claude/mine.db`, a local sqlite database built from your claude code session logs at `~/.claude/projects/`.

- dollar amounts show **API inference value** (what your usage would cost at published per-token rates), not what you actually pay on a subscription
- all counts exclude subagent sessions by default
- use `/mine backfill` if data seems stale

## setup

if you don't have a database yet, just run `/mine` — it'll walk you through setup.
